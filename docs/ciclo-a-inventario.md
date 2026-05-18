# Ciclo A — Inventario y Movimientos

**Fecha:** 2026-05-18  
**Branch:** `feat/inventario-ciclo-a`

---

## Qué se hizo

### Backend (`/hormigas` Spring Boot)

**`MotivoMovimientoController`**
- `GET /{empresaId}` → `GET /` (sin path param)
- Todos los endpoints usan `@AuthenticationPrincipal Usuario` para scopear por empresa del JWT

**`MotivoMovimientoService`**
- `listar(Usuario)` filtra por `findByEmpresaAndActivoTrue(usuario.getEmpresa())`
- `crear(dto, Usuario)` toma empresa del usuario autenticado
- `actualizar` y `desactivar` verifican que el motivo pertenezca a la empresa del usuario (`AccessDeniedException` si no)

**`CrearMotivoDTO`**
- Eliminado campo `empresaId` — era innecesario y rompía el scoping multi-empresa

**`MotivoMovimientoRepository`**
- Agregado `findByEmpresaAndActivoTrue(Empresa empresa)`

---

### Domain (`packages/domain`)

**`Schema.ts`** — tabla `inventario` extendida con columnas de cache:
- `producto_nombre TEXT NOT NULL DEFAULT ''`
- `sucursal_nombre TEXT NOT NULL DEFAULT ''`
- `precio REAL`
- `stock_minimo INTEGER NOT NULL DEFAULT 0`
- `stock_maximo INTEGER NOT NULL DEFAULT 0`
- `synced_at INTEGER NOT NULL DEFAULT 0`

---

### Application (`packages/application`)

Nuevos DTOs en `use-cases/`:
- `inventario/inventario.dto.ts` — `InventarioItemDTO`, `CreateInventarioDTO`
- `movimiento/movimiento.dto.ts` — `TipoMovimiento` (6 valores), `AlertaStockDTO`, `MovimientoResponseDTO`, `CreateMovimientoDTO`, `MovimientoFiltroDTO`
- `motivo/motivo.dto.ts` — `MotivoDTO`
- `reporte/reporte.dto.ts` — `ValorInventarioDTO`, `ValorInventarioDetalleDTO`

Nuevos puertos en `port/`:
- `inventario-api.port.ts` — `IApiInventarioRepository`, `ISqliteInventarioRepository`
- `movimiento-api.port.ts` — `IApiMovimientoRepository`
- `motivo-api.port.ts` — `IApiMotivoRepository`
- `reporte-api.port.ts` — `IApiReporteRepository`

---

### Infrastructure (`packages/infrastructure/src/`)

| Archivo | Descripción |
|---|---|
| `inventario/ApiInventarioRepositoryImpl.ts` | GET `/api/inventario/porSucursal?sucursalId=`, POST `/api/inventario/crear` |
| `inventario/SqliteInventarioRepositoryImpl.ts` | Cache local — `findBySucursal`, `findLowStock` (`stock_actual < stock_minimo`), `upsertMany` con INSERT OR REPLACE |
| `movimiento/ApiMovimientoRepositoryImpl.ts` | POST `/api/movimiento/crear`, GET `/api/movimiento/buscar` con URLSearchParams |
| `motivo/ApiMotivoRepositoryImpl.ts` | GET `/api/motivos-movimiento` (sin path param — empresa del JWT) |
| `reporte/ApiReporteRepositoryImpl.ts` | GET `/api/reportes/valor-inventario?sucursalId=` |

---

### Mobile — `hormigas_mobile`

**DataBase.ts** — migración ALTER TABLE para instancias existentes:
```ts
const INVENTARIO_MIGRATIONS = [
  `ALTER TABLE inventario ADD COLUMN producto_nombre TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE inventario ADD COLUMN sucursal_nombre TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE inventario ADD COLUMN precio REAL`,
  `ALTER TABLE inventario ADD COLUMN synced_at INTEGER NOT NULL DEFAULT 0`,
]
// try/catch por statement — column exists = ignorado
```

**Nuevos adapters (`src/adapters/`):**
- `inventarioServiceInstance.ts` — `getInventarioRepos()` → `{api, sqlite}`
- `movimientoServiceInstance.ts` — `getMovimientoRepo()`
- `motivoServiceInstance.ts` — `getMotivoRepo()`
- `reporteServiceInstance.ts` — `getReporteRepo()`

**Nuevos hooks (`src/utils/hooks/`):**
- `useInventario.ts` — `loadLocal`, `syncFromServer`, `crearInventario`, `refresh`
- `useMovimiento.ts` — `registrar` (online only) → `MovimientoResponseDTO | null`
- `useMotivo.ts` — `load` cuando hay red → `{motivos: MotivoDTO[]}`

**Nuevas pantallas (`src/inventario/screens/`):**
- `InventarioScreen.tsx` — FlatList con badge Crítico/Bajo/OK, botones VENTA (rojo) / COMPRA (verde) / Otro (gris) por ítem
- `CreateInventarioScreen.tsx` — selector de producto + 3 campos de stock
- `MovimientoScreen.tsx` — botones fijos VENTA/COMPRA + chips AJUSTE/MERMA/DEVOLUCION, selector de motivo filtrado por tipo, campo referencia, `AlertCard` post-guardado

**Nuevas rutas Expo Router:**
- `app/(branche)/[sucursalId]/inventario.tsx`
- `app/(branche)/[sucursalId]/movimiento.tsx`

**Mocks eliminados:**
- `BranchSummaryScreen` — hardcode reemplazado por `Promise.all` sobre `reporteRepo.valorInventario` por sucursal + conteo `stockBajo` desde cache
- `LowStockSection` — hardcode reemplazado por `sqlite.findLowStock()` con sync previo si hay red
- `BranchesScreen` — modal comentado descomentado; bug en `updateBranch` corregido (spread incompleto); navegación tap-fila → inventario conectada

---

## Endpoints de backend que consume esta versión

| Método | Path | Uso |
|---|---|---|
| GET | `/api/inventario/porSucursal?sucursalId=` | Listar ítems de inventario |
| POST | `/api/inventario/crear` | Crear ítem de inventario |
| POST | `/api/movimiento/crear` | Registrar movimiento de stock |
| GET | `/api/movimiento/buscar` | Buscar movimientos con filtros |
| GET | `/api/motivos-movimiento` | Listar motivos (empresa del JWT) |
| GET | `/api/reportes/valor-inventario?sucursalId=` | Valor total de inventario por sucursal |
| GET | `/api/producto/buscar` | Selector de producto en CreateInventarioScreen |

---

## Pendiente — Ciclo B

- Pantallas de Traslados entre sucursales
- Módulo de Reportes completo (movimientos paginados, productos top)
- CRUD de Motivos de movimiento
