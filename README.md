# Hormigas — Interfaz cliente

Monorepo de aplicaciones móviles para el sistema de inventarios y punto de venta Hormigas. Arquitectura offline-first: SQLite local primero, sincronización con la API en segundo plano.

---

## Aplicaciones

### hormigas_mobile
App de gestión para administradores (ADMIN). Permite crear y gestionar productos, sucursales, inventarios, movimientos de stock y usuarios de la empresa. Flujo offline-first completo con cola de sincronización.

**Pantallas:**
- Login → detecta rol y redirige
- Home — métricas, stock bajo, resumen de valor de inventario por sucursal
- Productos — CRUD, búsqueda por nombre/SKU, toggle activo
- Sucursales — CRUD, activar/desactivar
  - → Inventario por sucursal — lista de ítems con badge de stock, crear ítem
  - → Registrar movimiento — VENTA, COMPRA, AJUSTE, MERMA, DEVOLUCIÓN (con motivo y referencia opcionales)
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

**Estrategia para inventario y movimientos (Opción C):**
- **Lectura:** cache SQLite → si hay red, sync desde API → actualiza cache
- **Escritura:** requiere red → llama API → invalida cache

Las operaciones de stock son críticas en tiempo real; no se encolan para envío diferido.

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

### Flujo de navegación — hormigas_mobile

```
(tabs)/home        → BranchSummaryScreen (valor inventario por sucursal)
                   → LowStockSection (stock bajo desde cache SQLite)

(tabs)/branche     → BranchesScreen
                       → tap sucursal → /(branche)/[sucursalId]/inventario
                           → InventarioScreen
                               → botón "+" → modal CreateInventarioScreen
                               → VENTA / COMPRA / Otro → /(branche)/[sucursalId]/movimiento
                                   → MovimientoScreen → guardar → router.back()
                       → tap "+" → newBranch
```

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
| Backend | Spring Boot (ver `/hormigas`) con JWT Bearer auth |

---

## Paquetes compartidos

### `@hormigas/domain`
Entidades TypeScript y schema SQL:

- **Entidades:** `Product`, `Branch`, `User`, `Inventary`, `Transaction`, `Sale`, `SaleItem`
- **`CREATE_TABLES_SQL`** — DDL completo SQLite incluyendo tabla `inventario` con columnas de cache: `producto_nombre`, `sucursal_nombre`, `precio`, `stock_minimo`, `stock_maximo`, `synced_at`

### `@hormigas/application`
Lógica de negocio e interfaces:

- **Servicios:** `ProductService`, `SaleService`
- **`SaleService`** — `registerSale()`, `syncPending()`, `searchProducts()`, `pullProductsWithStock()`, `getHistory()`
- **Puertos API:**
  - `IApiBranchRepository`, `IApiProductRepository`, `IApiSaleRepository`, `IApiUserRepository`, `IApiEmpresaRepository`
  - `IApiInventarioRepository` — `listarPorSucursal`, `crear`
  - `IApiMovimientoRepository` — `crear`, `buscar`
  - `IApiMotivoRepository` — `listar`
  - `IApiReporteRepository` — `valorInventario`
- **Puertos SQLite:**
  - `ISqliteInventarioRepository` — `findBySucursal`, `findLowStock`, `upsertMany`
- **DTOs:** sale, product, branch, user, empresa, inventario, movimiento, motivo, reporte

### `@hormigas/infrastructure`
Implementaciones concretas:

- **`ApiHttpClient`** — fetch con Bearer token, métodos `get`, `post`, `put`, `patch`, `delete`
- **SQLite:** `SqliteProductRepositoryImpl`, `SqliteSaleRepositoryImpl`, `SqliteInventaryForSaleImpl`, `SqliteSyncQueueRepositoryImpl`, `SqliteInventarioRepositoryImpl`
- **API:** `ApiProductRepositoryImpl`, `ApiSaleRepositoryImpl`, `ApiUserRepositoryImpl`, `ApiEmpresaRepositoryImpl`, `ApiInventarioRepositoryImpl`, `ApiMovimientoRepositoryImpl`, `ApiMotivoRepositoryImpl`, `ApiReporteRepositoryImpl`
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
- Los singletons de servicio (`getSaleService`, `getProductService`, `getInventarioRepos`, etc.) son lazy — se inicializan en el primer uso y se reutilizan durante toda la sesión.
- `Product.categoriaId` almacena el `server_id` numérico del backend (quirk de naming heredado — el campo se llama `categoriaId` pero su comentario dice `// ID del servidor`).
- La tabla `inventario` en SQLite tiene columnas de cache (`producto_nombre`, `sucursal_nombre`, `precio`, `synced_at`). Instancias existentes reciben estas columnas vía `ALTER TABLE` con try/catch al inicializar la DB.
- Los motivos de movimiento se filtran por empresa en el backend usando `@AuthenticationPrincipal` — el frontend nunca envía `empresaId`.
