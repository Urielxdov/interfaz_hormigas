# Hormigas

> Sistema de inventarios con soporte offline-first para gestión de empresas, sucursales y productos.

---

## Descripción general

**Hormigas** es un monorepo que alberga las aplicaciones cliente del sistema de inventarios, compartiendo lógica de negocio común entre ellas. El sistema está diseñado bajo un principio **offline-first puro**: siempre se escribe primero en SQLite local, y la sincronización con la API ocurre en segundo plano o al recuperar conexión.

La sincronización se controla mediante:
- Una **bandera `synced`** por registro en SQLite (`0` = pendiente, `1` = confirmado por el servidor).
- Una **tabla `sync_queue`** que encola cada operación (CREATE / UPDATE / DELETE) hasta que el servidor responde con `HTTP 200`. Si falla, el registro queda en cola para el siguiente intento.

---

## Arquitectura del sistema

### Flujo offline-first

```
Usuario crea/edita dato
        │
        ▼
  SQLite local
  synced = 0
  + sync_queue (PENDING)
        │
        ├─── ¿Hay conexión? ──SÍ──► POST/PUT API
        │                               │
        │                         HTTP 200?
        │                        /        \
        │                      SÍ          NO
        │                      │            │
        │                synced=1      retries++
        │                queue DONE    (reintento)
        │
   Conexión restaurada
        │
        ▼
   pullFromServer() ──► descarga estado del servidor
   syncPending()    ──► procesa cola pendiente (CREATE y UPDATE)
```

### Reglas de sincronización

| Operación | Con `serverId` | Sin `serverId` |
|---|---|---|
| CREATE | Encola CREATE | Encola CREATE |
| UPDATE | Encola UPDATE | Solo guarda local (CREATE pendiente llevará el estado más reciente al sincronizarse) |
| toggleActive | Encola UPDATE | Solo guarda local |

- `serverId` (o `categoriaId` en `Product`) se asigna únicamente tras confirmar un CREATE con el servidor.
- `ProductSqliteMapper.toRow()` y `BranchSqliteMapper.toRow()` preservan siempre el `server_id` en cada save para que un UPDATE local no lo borre.

### Modelo de datos principal

```
Empresa
  └── Sucursal (N por empresa)
        ├── Inventario (ligado a la sucursal, stock por producto)
        └── Producto (catálogo global)
```

### Estructura del monorepo

```
hormigas_interfaz/
├── apps/
│   ├── mobile/
│   │   ├── hormigas_mobile/     # App de gestión de inventario (React Native)
│   │   ├── hormigas_POS/        # App de Punto de Venta (React Native)
│   │   └── shared/              # NetworkContext, factories compartidos
│   └── desktop/
│       └── hormigas_desktop/    # App Electron (scaffolding, sin lógica aún)
└── packages/
    ├── domain/                  # Entidades, Schema SQL, value objects
    ├── application/             # Casos de uso, interfaces, servicios, DTOs
    └── infrastructure/          # Implementaciones: SQLite, HTTP, Mappers
```

### Dependencias entre capas

```
domain  ←  application  ←  infrastructure  ←  mobile app
```

Ninguna capa inferior importa de capas superiores.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Apps móviles | React Native 0.81 + Expo 54 + TypeScript |
| Navegación | Expo Router |
| UI | NativeWind (Tailwind CSS) |
| Base de datos local | expo-sqlite v15 |
| HTTP client | fetch nativo + `ApiHttpClient` (Bearer token) |
| Almacenamiento seguro | expo-secure-store (tokens JWT) |
| Base de datos nube | PostgreSQL (via API Spring Boot) |

---

## Configuración de entorno

Crear el archivo `.env` en cada app que lo requiera:

```
# apps/mobile/hormigas_mobile/.env
EXPO_PUBLIC_API_URL=http://<ip-del-servidor>:8080

# apps/mobile/hormigas_POS/.env
EXPO_PUBLIC_API_URL=http://<ip-del-servidor>:8080
```

---

## Capas del sistema

### `packages/domain`
- **Entidades:** `Product`, `Branch`, `User`, `Inventary`, `Transaction`
  - `Branch` incluye `serverId?: number` para trazar el ID del servidor tras sincronizar.
  - `Product` usa `categoriaId?: number` como alias del `server_id` del servidor.
- `Schema.ts` — DDL completo para SQLite (todas las tablas, incluyendo `sync_queue` y `pos_producto`)

### `packages/application`

**Interfaces de repositorio:**
- `IProductRepository` — incluye `findAllWithStock()` y `findLowStock()` para consultas enriquecidas con la tabla `inventario`
- `IBranchRepository`, `ISyncQueueRepository`

**Puertos API:**
- `IApiProductRepository` — `create()`, `update(serverId, dto)`, `findAll()`
- `IApiBranchRepository` — `create()`, `update(serverId, dto)`, `findAll()`
- `IApiPOSRepository`

**Servicios:**

`ProductService` — lógica offline-first completa:
- `create(dto)` → guarda en SQLite + encola CREATE en sync_queue; si `dto.control=true` incluye `stockMinimo`/`stockMaximo` en el payload
- `update(product)` → guarda local; si tiene `categoriaId` encola UPDATE
- `toggleActive(localId)` → guarda local; si tiene `categoriaId` encola UPDATE
- `findAll()` → lee desde SQLite
- `findAllWithStock()` → LEFT JOIN producto ↔ inventario, suma stock por producto
- `getLowStock()` → productos donde `stock_actual < stock_minimo` en inventario
- `syncPending()` → procesa CREATE y UPDATE de la cola
- `pullFromServer()` → descarga catálogo del servidor, deduplica por SKU

`BranchService` — mismo patrón que `ProductService`:
- `create(dto)` → guarda local + encola CREATE
- `update(branch)` → guarda local; si tiene `serverId` encola UPDATE
- `toggleActive(localId)` → guarda local; si tiene `serverId` encola UPDATE
- `syncPending()` → procesa CREATE y UPDATE de la cola

`POSService` — punto de venta offline-first:
- `syncProducts(sucursalId)` → reemplaza catálogo local desde API
- `getProducts(sucursalId)` → lee desde SQLite (`pos_producto`)
- `submitSale(items, sucursalId)` → actualiza stock local + encola movimiento VENTA
- `syncPending()` → empuja movimientos pendientes al servidor

**DTOs:**
- `CreateProductDTO` — campos: `nombre, sku, categoria, precio, estado, control, stockMinimo?, stockMaximo?`
- `NuevoProductoDTO` — payload hacia la API; incluye `stockMinimo?, stockMaximo?, controlStock?`
- `UpdateProductoDTO` — campos opcionales para actualizaciones parciales
- `UpdateSucursalDTO` — campos opcionales para actualizaciones parciales de sucursal
- `ProductWithStock` — `Product & { stockTotal: number }`
- `LowStockItem` — `Product & { stockActual, stockMinimo, sucursalId }`
- `BranchItemListDTO` — incluye `serverId?: number`

### `packages/infrastructure`

**HTTP:**
- `ApiHttpClient` — `get()`, `post()`, `put()`, `delete()` con Bearer token automático

**SQLite — repositorios:**
- `SqliteProductRepositoryImpl` — implementa `IProductRepository` incluyendo `findAllWithStock()` (LEFT JOIN) y `findLowStock()` (JOIN con filtro)
- `SqliteBranchRepositoryImpl` — preserva `server_id` en cada save via `BranchSqliteMapper`
- `SqliteSyncQueueRepositoryImpl` — gestiona la cola de operaciones pendientes
- `SqlitePOSCacheRepositoryImpl` — caché local del catálogo POS por sucursal

**API — repositorios:**
- `ApiProductRepositoryImpl` — `POST /api/producto/nuevo`, `PUT /api/producto/{id}`, `GET /api/producto/`
- `ApiBranchRepositoryImpl` — `POST /api/sucursal/nuevo`, `PUT /api/sucursal/{id}`, `GET /api/sucursal/`
- `ApiPOSRepositoryImpl` — endpoints de inventario y movimientos por sucursal

**Mappers:**
- `ProductSqliteMapper.toRow()` — preserva `server_id` desde `product.categoriaId` para evitar pérdida en updates
- `BranchSqliteMapper.toDomain()` — mapea `server_id` a `branch.serverId`

### `apps/mobile/hormigas_mobile`

App de gestión de inventario para administradores.

- **`ExpoSQLiteClient`** — adapter que envuelve `expo-sqlite` como `DatabaseClient`
- **`productServiceInstance.ts` / `branchServiceInstance.ts`** — singletons lazy con todas las dependencias inyectadas
- **`useProducts`** — lee stock real via `findAllWithStock()`, propaga `categoriaId` para que updates no pierdan el `server_id`; dispara `pullFromServer()` + `syncPending()` al recuperar red
- **`useBranches`** — propaga `serverId` en el DTO para que updates encolen correctamente
- **`useDashboard`** — hook centralizado en `HomeScreen` que carga en paralelo: conteo de productos, items con stock bajo, y lista de sucursales reales desde SQLite

**Pantallas:**
- Login → Home (métricas reales) → Sucursales → Productos
- Home muestra datos reales: total de productos, total de sucursales, alertas de stock bajo desde la tabla `inventario`

### `apps/mobile/hormigas_POS`

App de punto de venta para cajeros en sucursal.

- **`useLogin`** → autenticación + selección de sucursal
- **`usePOS`** — carga catálogo desde SQLite, sincroniza con servidor al conectarse, gestiona carrito y registra ventas offline
- **Pantalla de venta** — grid de productos con búsqueda, carrito modal, indicador online/offline

---

## Roadmap

### Completado
- [x] Monorepo base con estructura `/packages` (domain + application + infrastructure)
- [x] Login con JWT via API y almacenamiento seguro del token
- [x] `ApiHttpClient` genérico con Bearer token (URL desde `.env`)
- [x] SQLite inicializado con todas las tablas al arranque
- [x] Offline-first para **Producto**: `create` y `update` local → `sync_queue` → push al API
- [x] Offline-first para **Sucursal**: `create` y `update` local → `sync_queue` → push al API
- [x] `syncPending()` procesa operaciones CREATE y UPDATE al recuperar conexión
- [x] `pullFromServer()` descarga catálogo desde el servidor (deduplicación por SKU)
- [x] Stock real leído desde tabla `inventario` via LEFT JOIN en `findAllWithStock()`
- [x] Dashboard Home con datos reales (productos, sucursales, alertas de stock)
- [x] App **Punto de Venta (POS)** — catálogo por sucursal, carrito, ventas offline-first
- [x] `server_id` preservado en cada save para no perder sincronización al editar registros

### Pendiente
- [ ] Carga batch automática con reintentos y backoff exponencial
- [ ] Manejo de conflictos en sincronización (servidor gana vs. cliente gana)
- [ ] Poblar tabla `inventario` al crear producto con `control=true` (actualmente se envía al servidor pero no se inserta localmente hasta el pull)
- [ ] Extender offline-first a movimientos de inventario en `hormigas_mobile`
- [ ] App Electron (desktop) compartiendo lógica de `/packages`
- [ ] Dashboard web de administración
- [ ] Soporte multi-usuario con roles por sucursal

---

## Instalacion

> Requisitos: Node.js 20+, pnpm, entorno React Native / Expo configurado.

```bash
# Clonar
git clone https://github.com/Urielxdov/hormigas_interfaz.git
cd hormigas_interfaz

# Instalar dependencias
pnpm install

# Configurar entorno (app de inventario)
echo "EXPO_PUBLIC_API_URL=http://10.44.1.140:8080" > apps/mobile/hormigas_mobile/.env

# Configurar entorno (app POS)
echo "EXPO_PUBLIC_API_URL=http://10.44.1.140:8080" > apps/mobile/hormigas_POS/.env

# Iniciar la app de inventario
cd apps/mobile/hormigas_mobile
pnpm android   # o pnpm ios

# Iniciar la app POS (en otra terminal)
cd apps/mobile/hormigas_POS
pnpm android   # o pnpm ios
```

---

## Notas de desarrollo

- La bandera `synced` **nunca cambia a `1` en el cliente** si el servidor no confirma con `HTTP 200`.
- El `local_id` (UUID) es la clave primaria local; `server_id` se asigna tras la primera sincronización exitosa. En `Product` se expone como `categoriaId`; en `Branch` como `serverId`.
- Si un registro no está sincronizado (sin `server_id`), los `update()` solo guardan localmente. Cuando el CREATE pendiente se sincronice, el servidor recibirá el estado actual en ese momento.
- El stock (`inventario`) se pobla desde el servidor via `pullFromServer()`. Localmente existirá inventario solo si el servidor lo retorna en la descarga o si el usuario creó el producto con `control=true` y el servidor procesó el stock inicial.
- Todos los modelos viven en `@hormigas/domain` y los casos de uso en `@hormigas/application`. Ningún paquete de nivel inferior importa de capas superiores.

---

*Proyecto en desarrollo activo.*
