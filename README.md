# Hormigas — Interfaz cliente

Monorepo de aplicaciones móviles para el sistema de inventarios y punto de venta Hormigas. Arquitectura offline-first: SQLite local primero, sincronización con la API en segundo plano.

---

## Aplicaciones

### hormigas_mobile
App de gestión para administradores (ADMIN). Permite crear y gestionar productos, sucursales, inventarios y usuarios de la empresa. Flujo offline-first completo con cola de sincronización.

**Pantallas:**
- Login → detecta rol y redirige
- Home — métricas, stock bajo, resumen por sucursal
- Productos — CRUD, búsqueda por nombre/SKU, toggle activo
- Sucursales — CRUD, activar/desactivar
- Usuarios — listar y crear usuarios para la empresa (ADMIN only)
- **Panel SUPER_ADMIN** — listar todas las empresas, crear empresa + admin, activar/desactivar

### hormigas_POS
App de punto de venta para cajeros (USER). Opera completamente offline; sincroniza ventas cuando hay conexión.

**Pantallas:**
- Login → redirige al POS
- Venta — búsqueda de producto en tiempo real, carrito multi-producto, cálculo de cambio, registro de venta
- Historial — ventas locales con detalle expandible y estado de sync
- Badge de sincronización en header (pendiente / sincronizando / listo)

---

## Arquitectura

### Flujo offline-first

```
Usuario registra venta / crea producto
          │
          ▼
    SQLite local (inmediato)
    sync_queue → PENDING
          │
          ├── ¿Hay conexión? → POST API → HTTP 200 → queue DONE
          │                              → error → retries++
          │
    Al recuperar conexión:
    syncPending() → procesa toda la cola
    pullProductsWithStock() → refresca inventario local
```

### Estructura del monorepo

```
interfaz_hormigas/
├── apps/
│   └── mobile/
│       ├── hormigas_mobile/     # App de gestión (ADMIN / SUPER_ADMIN)
│       ├── hormigas_POS/        # App punto de venta (USER)
│       └── shared/              # NetworkContext, factories compartidos
└── packages/
    ├── domain/                  # Entidades TS, Schema SQL SQLite
    ├── application/             # Casos de uso, interfaces, servicios
    └── infrastructure/          # Implementaciones: SQLite, HTTP, mappers
```

### Dependencias entre capas

```
domain  ←  application  ←  infrastructure  ←  app (mobile / POS)
```

Ninguna capa inferior importa de capas superiores.

---

## Stack tecnológico

| Área | Tecnología |
|---|---|
| Framework | React Native 0.81 + Expo 54 |
| Navegación | Expo Router 6 |
| UI — hormigas_mobile | NativeWind (Tailwind CSS) + Lucide icons |
| UI — hormigas_POS | StyleSheet (sin Tailwind) + Ionicons |
| Base de datos local | expo-sqlite v16 |
| Almacenamiento seguro | expo-secure-store (JWT) |
| Gestión de paquetes | pnpm workspaces |
| Lenguaje | TypeScript strict |

---

## Paquetes compartidos

### `@hormigas/domain`
Entidades TypeScript y schema SQL:

- **Entidades:** `Product`, `Branch`, `User`, `Inventary`, `Transaction`, `Sale`, `SaleItem`
- **`CREATE_TABLES_SQL`** — DDL completo SQLite: producto, inventario, movimiento, sucursal, sync_queue, venta, venta_item

### `@hormigas/application`
Lógica de negocio e interfaces:

- **Servicios:** `ProductService`, `SaleService`
- **`SaleService`** — `registerSale()`, `syncPending()`, `searchProducts()`, `pullProductsWithStock()`, `getHistory()`
- **Puertos API:** `IApiProductRepository`, `IApiSaleRepository`, `IApiUserRepository`, `IApiEmpresaRepository`
- **Interfaces SQLite:** `IProductRepository`, `ISaleRepository`, `ISyncQueueRepository`, `ILocalInventaryRepository`
- **DTOs:** sale, product, branch, user, empresa

### `@hormigas/infrastructure`
Implementaciones concretas:

- **`ApiHttpClient`** — fetch con Bearer token, métodos `get`, `post`, `put`, `patch`, `delete`
- **SQLite:** `SqliteProductRepositoryImpl`, `SqliteSaleRepositoryImpl`, `SqliteInventaryForSaleImpl`, `SqliteSyncQueueRepositoryImpl`
- **API:** `ApiProductRepositoryImpl`, `ApiSaleRepositoryImpl`, `ApiUserRepositoryImpl`, `ApiEmpresaRepositoryImpl`
- **Auth:** `TokenServiceImpl` (expo-secure-store), `UserServiceHTTP`

---

## Flujo de autenticación y roles

```
Login
  │
  ├── token.roles contiene ROLE_SUPER_ADMIN
  │     └── → /(superadmin)  panel de gestión de empresas
  │
  └── ROLE_ADMIN / ROLE_USER
        └── → /(tabs)/home   app de gestión normal
```

El JWT se decodifica en el cliente (base64) para extraer `roles` y `sucursalId`. No se hace ninguna llamada extra al servidor para determinar el rol.

---

## Configuración de entorno

Crear `.env` en cada app:

**`apps/mobile/hormigas_mobile/.env`**
```env
EXPO_PUBLIC_API_URL=http://<ip-servidor>:8080
```

**`apps/mobile/hormigas_POS/.env`**
```env
EXPO_PUBLIC_API_URL=http://<ip-servidor>:8080
```

---

## Instalación

**Requisitos:** Node.js 20+, pnpm, entorno Expo / Android Studio o Xcode

```bash
git clone https://github.com/Urielxdov/interfaz_hormigas.git
cd interfaz_hormigas

pnpm install
```

**Iniciar hormigas_mobile:**
```bash
cd apps/mobile/hormigas_mobile
pnpm android   # o pnpm ios
```

**Iniciar hormigas_POS:**
```bash
cd apps/mobile/hormigas_POS
pnpm android   # o pnpm ios
```

---

## Sincronización

Cada app mantiene su propia base de datos SQLite independiente. La cola de sincronización (`sync_queue`) registra operaciones pendientes de enviar al servidor.

| Campo | Descripción |
|---|---|
| `entity` | Tipo de recurso: `producto`, `venta` |
| `operation` | `CREATE`, `UPDATE`, `DELETE` |
| `payload` | JSON con los datos a enviar |
| `status` | `PENDING` → `DONE` |
| `retries` | Incrementa en cada fallo |

El badge de sincronización en el header de cada app muestra el estado en tiempo real (poll cada 3 segundos).

---

## Notas de desarrollo

- `local_id` (UUID generado en cliente) es la clave primaria local. `server_id` se asigna tras la primera sincronización exitosa.
- La bandera `synced` solo cambia a `1` si el servidor confirma con HTTP 200.
- El POS llama a `pullProductsWithStock()` al montar la pantalla principal para tener el inventario actualizado.
- hormigas_POS usa `hormigas_pos.db` como nombre de base de datos, separado del de hormigas_mobile (`hormigas.db`).
- Los singletons de servicio (`getSaleService`, `getProductService`) son lazy — se inicializan en el primer uso y se reutilizan durante toda la sesión.
