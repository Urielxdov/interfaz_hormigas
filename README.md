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
   syncPending() ──► procesa cola pendiente
   pullFromServer() ──► descarga estado del servidor
```

### Modelo de datos principal

```
Empresa
  └── Sucursal (N por empresa)
        ├── Inventario (ligado a la sucursal)
        └── Producto (N por sucursal)
```

### Estructura del monorepo

```
hormigas_interfaz/
├── apps/
│   ├── mobile/
│   │   ├── hormigas_mobile/     # App React Native activa
│   │   └── shared/              # NetworkContext, factories compartidos
│   └── desktop/                 # App Electron (futuro)
└── packages/
    ├── domain/                  # Entidades, Schema SQL
    ├── application/             # Casos de uso, interfaces, ProductService
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
| App móvil | React Native 0.81 + Expo 54 + TypeScript |
| Navegación | Expo Router |
| UI | NativeWind (Tailwind CSS) |
| Base de datos local | expo-sqlite v15 |
| HTTP client | fetch nativo + `ApiHttpClient` (Bearer token) |
| Almacenamiento seguro | expo-secure-store (tokens JWT) |
| Base de datos nube | PostgreSQL (via API Spring Boot) |

---

## Configuración de entorno

Crear el archivo `.env` en `apps/mobile/hormigas_mobile/`:

```
EXPO_PUBLIC_API_URL=http://<ip-del-servidor>:8080
```

---

## Capas del sistema

### `packages/domain`
- Entidades: `Product`, `Branch`, `User`, `Inventary`, `Transaction`
- `Schema.ts` — DDL completo para SQLite (todas las tablas, incluyendo `sync_queue`)

### `packages/application`
- **Interfaces de repositorio:** `IProductRepository`, `ISyncQueueRepository`
- **Puerto API:** `IApiProductRepository`
- **`ProductService`** — lógica offline-first:
  - `create(dto)` → guarda en SQLite + encola en sync_queue
  - `findAll()` → lee desde SQLite
  - `syncPending()` → procesa cola y empuja a la API
  - `pullFromServer()` → descarga productos del servidor a SQLite
- **`SyncManager`** — orquesta sync sobre ProductService
- **DTOs:** `CreateProductDTO`, `ProductListItemDTO`, `NuevoProductoDTO`, `ApiProductResponseDTO`

### `packages/infrastructure`
- **`ApiHttpClient`** — cliente HTTP con inyección automática de `Authorization: Bearer <token>` y URL configurable
- **`SqliteProductRepositoryImpl`** — implementa `IProductRepository` sobre expo-sqlite
- **`SqliteSyncQueueRepositoryImpl`** — implementa `ISyncQueueRepository` sobre la tabla `sync_queue`
- **`ApiProductRepositoryImpl`** — llama a `POST /api/producto/nuevo` y `GET /api/producto/`
- **`UserServiceHTTP`** — login via `POST /api/auth/login` usando `ApiHttpClient`
- **`TokenServiceImpl`** — persiste el JWT en expo-secure-store

### `apps/mobile/hormigas_mobile`
- **`ExpoSQLiteClient`** — adapter que envuelve `expo-sqlite` como `DatabaseClient`
- **`productServiceInstance.ts`** — singleton lazy de `ProductService` con todas las dependencias inyectadas
- **`useProducts`** — hook que lee de SQLite, crea productos y dispara sync automáticamente al recuperar red

---

## Roadmap

### Completado
- [x] Monorepo base con estructura `/packages` (domain + application + infrastructure)
- [x] App React Native — gestión de empresas, sucursales, inventarios y productos (UI)
- [x] Login con JWT via API
- [x] `ApiHttpClient` genérico con Bearer token (URL desde `.env`)
- [x] SQLite inicializado con todas las tablas al arranque
- [x] Capa offline-first para **Producto**: create local → sync_queue → push al API
- [x] `syncPending()` automático al recuperar conexión de red
- [x] `pullFromServer()` para descargar catálogo desde el servidor

### En proceso
- [ ] Carga batch automática con reintentos y backoff
- [ ] Manejo de conflictos en sincronización (servidor gana vs. cliente gana)
- [ ] App de **Punto de Venta (POS)** — movimientos de inventario
- [ ] Extender offline-first a Sucursal, Inventario y Movimiento

### Futuro alcance
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

# Configurar entorno
echo "EXPO_PUBLIC_API_URL=http://10.44.1.140:8080" > apps/mobile/hormigas_mobile/.env

# Iniciar la app móvil
cd apps/mobile/hormigas_mobile
pnpm android   # o pnpm ios
```

---

## Notas de desarrollo

- La bandera `synced` **nunca cambia a `1` en el cliente** si el servidor no confirma con `HTTP 200`.
- El `local_id` (UUID) es la clave primaria local; `server_id` se asigna tras la primera sincronización exitosa.
- Todos los modelos viven en `@hormigas/domain` y los casos de uso en `@hormigas/application`. Ningún paquete de nivel inferior importa de capas superiores.
- La app de Punto de Venta será donde el modo offline cobra mayor relevancia dado el volumen de movimientos en sucursales sin conexión estable.

---

*Proyecto en desarrollo activo.*
