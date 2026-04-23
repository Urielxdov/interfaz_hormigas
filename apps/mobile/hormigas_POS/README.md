# Hormigas POS

Aplicación de punto de venta (POS) para el sistema Hormigas. Permite registrar ventas por sucursal con flujo offline-first.

## Flujo de la app

1. **Login** — el cajero ingresa con email y contraseña (JWT almacenado en SecureStore)
2. **Selección de sucursal** — el cajero elige desde qué sucursal está vendiendo
3. **Pantalla de venta** — grid de productos con búsqueda, carrito y botón de cobro
4. **Offline-first** — las ventas se guardan localmente y se sincronizan cuando hay conexión

## Correr el proyecto

Desde la raíz del monorepo:

```bash
cd apps/mobile/hormigas_POS
npm install
expo start
```

## Variables de entorno

Crea un archivo `.env` en esta carpeta:

```
EXPO_PUBLIC_API_URL=http://localhost:8080
```

## Arquitectura

```
hormigas_POS/
├── app/
│   ├── _layout.tsx          # Guard de autenticación y routing
│   ├── login.tsx            # Pantalla de login
│   ├── branch-select.tsx    # Selección de sucursal
│   └── (pos)/
│       └── sale.tsx         # Pantalla principal de venta
├── adapters/
│   ├── AsyncStorageAdapter.ts   # SecureStore wrapper
│   ├── ExpoSQLiteClient.ts      # SQLite wrapper
│   └── posServiceInstance.ts    # Singleton del POSService
├── context/
│   ├── AuthContext.tsx      # Token + sucursal seleccionada
│   └── NetworkContext.tsx   # Estado de conexión
├── db/
│   └── DataBase.ts          # Inicialización de hormigas_pos.db
└── hooks/
    ├── useLogin.ts          # Autenticación contra API
    └── usePOS.ts            # Productos, carrito y sync
```

## Capas del monorepo usadas

| Paquete | Qué aporta |
|---|---|
| `@hormigas/application` | `POSService`, `CartItem`, `POSProductDTO`, `SucursalDTO` |
| `@hormigas/infrastructure` | `ApiPOSRepositoryImpl`, `SqlitePOSCacheRepositoryImpl`, `SqliteSyncQueueRepositoryImpl` |
| `@hormigas/domain` | `CREATE_TABLES_SQL` (incluye tabla `pos_producto`) |

## Endpoints del backend usados

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Autenticación |
| `GET` | `/api/sucursal/listar` | Lista de sucursales activas |
| `GET` | `/api/inventario/porSucursal?sucursalId=` | Productos con stock por sucursal |
| `POST` | `/api/movimiento/crear` | Registra un movimiento tipo `VENTA` |

## Flujo offline-first

1. Al conectarse, sincroniza el catálogo de productos desde la API (`syncProducts`)
2. Al cobrar, cada ítem del carrito se guarda en `sync_queue` con `status = PENDING` y se reduce el stock local
3. Al reconectarse, `syncPending` envía los movimientos pendientes a la API
