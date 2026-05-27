# Hormigas — Documentación Técnica

Referencia técnica completa del monorepo: arquitectura, paquetes, base de datos, sincronización, autenticación y guías de desarrollo.

---

## Tabla de contenidos

1. [Stack tecnológico](#stack-tecnológico)
2. [Arquitectura de capas](#arquitectura-de-capas)
3. [Paquetes `@hormigas/*`](#paquetes-hormigas)
4. [Flujo offline-first](#flujo-offline-first)
5. [Cola de sincronización (`sync_queue`)](#cola-de-sincronización)
6. [Esquema SQLite](#esquema-sqlite)
7. [Autenticación y roles](#autenticación-y-roles)
8. [Setup de desarrollo](#setup-de-desarrollo)
9. [Build con EAS](#build-con-eas)
10. [Agregar una nueva entidad](#agregar-una-nueva-entidad)
11. [Decisiones de diseño recientes](#decisiones-de-diseño-recientes)

---

## Stack tecnológico

| Área | Tecnología |
|------|------------|
| Framework | React Native 0.81 + Expo 54 |
| Navegación | Expo Router 6 (file-based) |
| UI — hormigas_mobile | NativeWind (Tailwind CSS) + Lucide icons |
| UI — hormigas_POS | StyleSheet nativo + Ionicons |
| Base de datos local | expo-sqlite v16 |
| Almacenamiento seguro | expo-secure-store (JWT) |
| Gestión de paquetes | pnpm workspaces |
| Lenguaje | TypeScript strict |
| Build en la nube | EAS Build (Expo Application Services) |

---

## Arquitectura de capas

El proyecto sigue Clean Architecture. Cada capa tiene una responsabilidad única y ninguna capa inferior importa de capas superiores.

```
┌──────────────────────────────────────────────┐
│         app (hormigas_mobile / POS)          │
│  screens, hooks, adapters, reducers, nav     │
└──────────────────┬───────────────────────────┘
                   │ usa
┌──────────────────▼───────────────────────────┐
│         @hormigas/infrastructure             │
│  SqliteProductRepositoryImpl, ApiHttpClient  │
└──────────────────┬───────────────────────────┘
                   │ implementa interfaces de
┌──────────────────▼───────────────────────────┐
│          @hormigas/application               │
│  ProductService, SaleService, puertos, DTOs  │
└──────────────────┬───────────────────────────┘
                   │ usa entidades de
┌──────────────────▼───────────────────────────┐
│             @hormigas/domain                 │
│  Product, Branch, Sale, CREATE_TABLES_SQL    │
└──────────────────────────────────────────────┘
```

### Reglas de capas

| Capa | Puede importar | No puede importar |
|------|---------------|-------------------|
| `domain` | nada externo | ninguna capa superior |
| `application` | `domain` | `infrastructure`, apps |
| `infrastructure` | `application`, `domain` | apps |
| app | todas | — |

---

## Paquetes `@hormigas/*`

### `@hormigas/domain`

Entidades TypeScript puras y schema SQL. Sin dependencias externas.

**Entidades:** `Product`, `Branch`, `User`, `Inventary`, `Sale`, `SaleItem`, `TypeTransaction`

**`CREATE_TABLES_SQL`** — DDL completo para SQLite. Se ejecuta en `initDatabase()` al arrancar la app. Incluye: `sucursal`, `usuario`, `producto`, `inventario`, `movimiento`, `sync_queue`, `venta`, `venta_item`.

---

### `@hormigas/application`

Lógica de negocio e interfaces (puertos). No toca SQLite ni `fetch` directamente.

**Servicios:**

| Servicio | Responsabilidad |
|----------|----------------|
| `ProductService` | CRUD de productos, sync offline, chequeo de duplicados |
| `SaleService` | registro de ventas, sync, búsqueda de productos con stock |
| `BranchService` | creación de sucursales, sync offline, chequeo de duplicados |
| `MovimientoService` | registro de movimientos de inventario |

**Puertos de API** (interfaces que `infrastructure` implementa):

- `IApiProductRepository` — `create`, `findAll`
- `IApiBranchRepository` — `listar`, `crear`
- `IApiSaleRepository` — `register`, `syncPending`
- `IApiUserRepository`, `IApiEmpresaRepository`, `IApiInventarioRepository`, etc.

**Errores tipados exportados:**

| Error | Cuándo se lanza |
|-------|----------------|
| `DuplicateProductError` | Al crear un producto con nombre o SKU ya existente. Incluye el producto existente (activo o inactivo) |
| `DuplicateBranchError` | Al crear una sucursal con nombre ya existente. Incluye la sucursal existente |

Estos errores permiten al UI diferenciar entre duplicado activo (mostrar aviso) e inactivo (ofrecer reactivación).

---

### `@hormigas/infrastructure`

Implementaciones concretas de los puertos. Aquí vive todo el I/O.

**SQLite:**

| Clase | Tabla |
|-------|-------|
| `SqliteProductRepositoryImpl` | `producto` |
| `SqliteBranchRepositoryImpl` | `sucursal` |
| `SqliteSyncQueueRepositoryImpl` | `sync_queue` |
| `SqliteInventarioRepositoryImpl` | `inventario` |
| `SqliteSaleRepositoryImpl` | `venta`, `venta_item` |
| `SqliteInventaryForSaleImpl` | `inventario` (lectura para POS) |

**HTTP:**

| Clase | Descripción |
|-------|-------------|
| `ApiHttpClient` | fetch con Bearer token. Métodos: `get`, `post`, `put`, `patch`, `delete` |
| `TokenServiceImpl` | guarda/lee JWT desde `expo-secure-store` |
| `ApiProductRepositoryImpl` | `/api/producto/*` |
| `ApiBranchRepositoryImpl` | `/api/sucursal/*` |
| `ApiUserRepositoryImpl` | `/api/usuario/*` |
| `ApiEmpresaRepositoryImpl` | `/api/empresa/*` |

---

## Flujo offline-first

### Principio

```
Mostrar datos locales inmediatamente.
Sincronizar con servidor en segundo plano.
Nunca bloquear la UI esperando la red.
```

### Ciclo de lectura

```
mount del screen
      │
      ▼
  loadLocal() → SQLite.findAll()
      │
      ▼
dispatch({ type: 'SET' })    ← UI muestra datos locales
      │
      │  (si isOnline)
      ▼
  syncFromServer() → API.listar()
      │
      ▼
SQLite.upsertMany()          ← persiste datos frescos
      │
      ▼
dispatch({ type: 'SET' })    ← UI se actualiza
```

### Ciclo de escritura (con sync_queue)

Usado para productos. Permite operar sin internet y sincronizar al reconectar.

```
createProduct(dto)
      │
      ├─ SQLite.save(product, synced=false)
      └─ sync_queue.save({ status: 'PENDING' })
      │
      ▼
dispatch({ type: 'CREATE' })   ← UI muestra el producto inmediatamente
      │
      │  (al reconectar)
      ▼
ProductService.syncPending()
  ├─ API.create(payload) → HTTP 200
  │     └─ markAsSynced(localId, serverId)
  │     └─ queue.markAsProcessed(id)
  └─ error → queue.incrementRetries(id)
```

### Patrón del hook

Todos los hooks de entidad siguen este patrón:

```ts
export function useBranches() {
  const [branches, dispatch] = useReducer(branchReducer, [])
  const { isOnline } = useNetwork()

  const loadLocal = useCallback(async () => {
    const { sqlite } = await getBranchRepos()
    dispatch({ type: 'SET', payload: await sqlite.findAll() })
  }, [])

  const syncFromServer = useCallback(async () => {
    const { api, sqlite } = await getBranchRepos()
    const data = await api.listar()
    await sqlite.upsertMany(data)
    dispatch({ type: 'SET', payload: data })
  }, [])

  // carga local siempre, independiente de red
  useEffect(() => { loadLocal() }, [loadLocal])

  // sincroniza cuando hay internet (también al reconectar)
  useEffect(() => {
    if (!isOnline) return
    syncFromServer().catch(e => console.warn('[useBranches] sync:', e))
  }, [isOnline, syncFromServer])
}
```

### `local_id` vs `server_id`

La tabla `producto` usa `local_id TEXT PRIMARY KEY` (UUID generado en cliente) y `server_id INTEGER` (asignado tras sync exitosa). La bandera `synced = 1` solo se activa cuando el servidor confirma con HTTP 200.

Al ejecutar `pullFromServer`, el sistema busca primero por `server_id`, luego por `sku` como fallback, para evitar crear filas duplicadas.

---

## Cola de sincronización

### Esquema

```sql
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,          -- 'producto', 'venta', 'sucursal'
  entity_id TEXT NOT NULL,       -- local_id del recurso
  operation TEXT NOT NULL,       -- 'CREATE', 'UPDATE', 'DELETE'
  payload TEXT NOT NULL,         -- JSON con los datos
  status TEXT NOT NULL DEFAULT 'PENDING',
  retries INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Estados

```
PENDING → (sync exitoso) → DONE
PENDING → (falla red)    → PENDING, retries++
PENDING → (retries ≥ 5)  → FAILED
```

`syncPending()` procesa hasta 20 items por llamada (configurable). El badge de sincronización en el header consulta esta tabla cada 3 segundos via `useSyncQueueStatus`.

---

## Esquema SQLite

Base de datos: `hormigas.db` (hormigas_mobile) / `hormigas_pos.db` (hormigas_POS).

```sql
-- Sucursales
CREATE TABLE IF NOT EXISTS sucursal (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion TEXT,
  activa INTEGER NOT NULL DEFAULT 1,
  empresa_id INTEGER
);

-- Usuarios
CREATE TABLE IF NOT EXISTS usuario (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  empresa_id INTEGER,
  fecha_creacion TEXT,
  ultimo_acceso TEXT
);

-- Productos (offline-first con UUID local)
CREATE TABLE IF NOT EXISTS producto (
  local_id TEXT PRIMARY KEY,     -- UUID generado en cliente
  server_id INTEGER,             -- asignado tras sync
  nombre TEXT NOT NULL,
  sku TEXT NOT NULL,
  descripcion TEXT,
  precio REAL,
  activo INTEGER NOT NULL DEFAULT 1,
  categoria TEXT,
  synced INTEGER NOT NULL DEFAULT 0
);

-- Inventario por sucursal
CREATE TABLE IF NOT EXISTS inventario (
  id INTEGER PRIMARY KEY,
  producto_id INTEGER NOT NULL,
  producto_nombre TEXT NOT NULL DEFAULT '',
  sucursal_id INTEGER NOT NULL,
  sucursal_nombre TEXT NOT NULL DEFAULT '',
  precio REAL,
  stock_actual INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  stock_maximo INTEGER NOT NULL,
  ultima_actualizacion TEXT,
  synced_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE (sucursal_id, producto_id),
  FOREIGN KEY (sucursal_id) REFERENCES sucursal(id)
);

-- Movimientos de inventario
CREATE TABLE IF NOT EXISTS movimiento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventario_id INTEGER,
  usuario_id INTEGER,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN (
    'COMPRA','VENTA','AJUSTE','MERMA','DEVOLUCION','TRASLADO_ENTRADA','TRASLADO_SALIDA'
  )),
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  referencia TEXT,
  fecha TEXT,
  sincronizado INTEGER NOT NULL DEFAULT 0
);

-- Cola de sincronización
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  retries INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Ventas (POS)
CREATE TABLE IF NOT EXISTS venta (
  id TEXT PRIMARY KEY,
  sucursal_id TEXT NOT NULL,
  total REAL NOT NULL,
  monto_recibido REAL NOT NULL,
  cambio REAL NOT NULL,
  fecha TEXT NOT NULL,
  sincronizado INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS venta_item (
  id TEXT PRIMARY KEY,
  venta_id TEXT NOT NULL REFERENCES venta(id),
  producto_local_id TEXT NOT NULL,
  producto_server_id INTEGER,
  nombre TEXT NOT NULL,
  sku TEXT NOT NULL,
  precio REAL NOT NULL,
  cantidad INTEGER NOT NULL,
  subtotal REAL NOT NULL
);
```

---

## Autenticación y roles

El JWT se decodifica en el cliente (base64) para extraer `roles` y `sucursalId`. No se hace ninguna llamada extra al servidor para determinar el rol.

### Flujo de redirección post-login

```
Login → decodifica JWT
  │
  ├── roles incluye ROLE_SUPER_ADMIN
  │     └── → /(superadmin)   panel de gestión de empresas
  │
  └── ROLE_ADMIN / ROLE_USER
        └── → /(tabs)/home    app de gestión normal
```

### Roles y permisos

| Rol | App | Acceso |
|-----|-----|--------|
| `ROLE_USER` | hormigas_POS | Registrar ventas, ver historial |
| `ROLE_ADMIN` | hormigas_mobile | Todo excepto panel super admin |
| `ROLE_SUPER_ADMIN` | hormigas_mobile | Panel de empresas, crear admins |

---

## Setup de desarrollo

### Requisitos

- Node.js 20+
- pnpm 8+ (`npm install -g pnpm`)
- Android Studio con emulador configurado, o Xcode para iOS

### Instalación

```bash
git clone https://github.com/Urielxdov/interfaz_hormigas.git
cd interfaz_hormigas
pnpm install
```

### Variables de entorno

Crear un archivo `.env` en la carpeta de cada app:

```bash
# apps/mobile/hormigas_mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080

# apps/mobile/hormigas_POS/.env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
```

### Comandos por app

```bash
# hormigas_mobile
cd apps/mobile/hormigas_mobile
pnpm start         # Metro bundler (escanear QR con Expo Go)
pnpm android       # Emulador Android
pnpm ios           # Simulador iOS

# hormigas_POS
cd apps/mobile/hormigas_POS
pnpm start
pnpm android
pnpm ios
```

### TypeScript

```bash
# Verificar tipos desde la raíz
npx tsc -p apps/mobile/hormigas_mobile/tsconfig.json --noEmit
npx tsc -p packages/infrastructure/tsconfig.json --noEmit
```

---

## Build con EAS

Recomendado: ejecutar desde la carpeta de cada app.

```bash
cd apps/mobile/hormigas_mobile

# Build para pruebas internas (APK)
eas build --platform android --profile preview

# Build de producción (AAB para Play Store)
eas build --platform android --profile production

# Build para iOS
eas build --platform ios --profile preview
```

### Perfiles disponibles

| Perfil | Uso | Formato |
|--------|-----|---------|
| `development` | Desarrollo local con hot reload | — |
| `preview` | Pruebas internas | APK / IPA |
| `production` | Tienda de aplicaciones | AAB / IPA |

### Limpiar caché si hay problemas

```bash
cd apps/mobile/hormigas_mobile
rm -rf node_modules .expo
pnpm install
eas build --platform android --profile preview --clear-cache
```

---

## Agregar una nueva entidad

Sigue este orden de capas. Ejemplo: agregar `Proveedor`.

### 1. domain — entidad y tabla

```ts
// packages/domain/entities/supplier/Supplier.ts
export interface Supplier {
  id: number
  nombre: string
  contacto?: string
  activo: boolean
}
```

Agregar al `CREATE_TABLES_SQL` en `packages/domain/database/Schema.ts`:

```sql
CREATE TABLE IF NOT EXISTS proveedor (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  contacto TEXT,
  activo INTEGER NOT NULL DEFAULT 1
);
```

### 2. application — DTOs, puerto, errores

```ts
// packages/application/use-cases/supplier/Supplier.dto.ts
export interface CreateProveedorDTO { nombre: string; contacto?: string }
export interface ProveedorItemDTO { id: number; nombre: string; contacto?: string; activo: boolean }

// packages/application/port/supplier-api.port.ts
export interface IApiProveedorRepository {
  listar(): Promise<ProveedorItemDTO[]>
  crear(dto: CreateProveedorDTO): Promise<ProveedorItemDTO>
}
```

Exportar desde `packages/application/index.ts`.

### 3. infrastructure — SQLite y API

Seguir el patrón de `SqliteBranchRepositoryImpl` y `ApiBranchRepositoryImpl`.

Exportar desde `packages/infrastructure/index.ts`.

### 4. app — adapter, reducer, hook

```ts
// Adapter singleton (mismo patrón que branchRepoInstance.ts)
// Reducer con: SET | CREATE | UPDATE | TOGGLE_STATUS
// Hook con: loadLocal + syncFromServer + mutaciones
```

### Checklist

- [ ] Entidad en `@hormigas/domain`
- [ ] Tabla en `CREATE_TABLES_SQL`
- [ ] DTOs en `packages/application/use-cases/<entity>/`
- [ ] Puerto en `packages/application/port/<entity>-api.port.ts`
- [ ] Exportar desde `packages/application/index.ts`
- [ ] `Sqlite<Entity>RepositoryImpl` en `packages/infrastructure/`
- [ ] `Api<Entity>RepositoryImpl` en `packages/infrastructure/`
- [ ] Exportar desde `packages/infrastructure/index.ts`
- [ ] Adapter singleton en `src/adapters/<entity>RepoInstance.ts`
- [ ] Reducer con acciones necesarias
- [ ] Hook con patrón offline-first

---

## Decisiones de diseño recientes

### Prevención de duplicados con soft-delete

`ProductService.create` y `BranchService.create` chequean duplicados por nombre (case-insensitive) y SKU antes de guardar. Lanzan errores tipados (`DuplicateProductError`, `DuplicateBranchError`) que incluyen el registro existente con su estado `activo`. El UI detecta si el duplicado está inactivo y ofrece reactivarlo en un modal de confirmación, sin necesidad de que el usuario busque el registro manualmente.

### Fix de duplicados en `pullFromServer`

Al sincronizar desde el servidor, `pullFromServer` buscaba el registro local solo por `sku`. Si el SKU había cambiado localmente antes de sincronizar, creaba una fila nueva (duplicado). El fix: buscar primero por `server_id` (más confiable), y usar `sku` solo como fallback. Adicionalmente, `update` ahora lee el registro existente antes de guardar para preservar el `server_id`.

Para sucursales, `upsertMany` ejecuta un `DELETE WHERE LOWER(nombre) = LOWER(?) AND id != ?` antes de cada upsert, eliminando la fila temporal creada offline cuando llega la versión definitiva del servidor.

### Validación de stock en movimientos de salida

`validateCantidad` acepta un parámetro opcional `maxStock`. En movimientos de tipo `SALIDA`, se pasa el `stockActual` del inventario. Si la cantidad excede el stock disponible, el formulario muestra el error antes de enviar. El campo de cantidad también muestra "Disponible: N" junto al label cuando el tipo es SALIDA.

### Teclado tapa modales en Android

`KeyboardAvoidingView` con `behavior='height'` en Android reduce la altura del contenedor pero no empuja el modal hacia arriba. Cambiado a `behavior='padding'` para ambas plataformas — agrega padding inferior cuando el teclado aparece, desplazando el contenido correctamente.
