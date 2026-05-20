# Design: Offline-First Movements, Low Stock Detection & HomeScreen Real Data

**Date:** 2026-05-20
**Scope:** Three sequential sub-projects that together replace mock data in HomeScreen with live data, add offline-first movement registration, and introduce low-stock alerting backed by SQLite + API.

---

## Sub-project order (must build in sequence)

1. **Offline movement queue + sync** — infrastructure
2. **Low stock detection** — feature, depends on SP1
3. **HomeScreen real data** — UI, depends on SP1 + SP2

---

## Sub-project 1: Offline-First Movement Queue + Sync

### Problem

`useMovimientos` calls `movimientoApiInstance` directly — no offline support. When offline, movement registration fails silently. SQLite `inventario` table has no `stock_minimo` column despite the domain entity supporting it.

### SQLite migration 006

New file: `packages/infrastructure/db/sqlite/migrations/006_add_stock_minimo.ts`

```sql
ALTER TABLE inventario ADD COLUMN stock_minimo INTEGER NOT NULL DEFAULT 0;
```

Update `SqliteInventaryForSaleImpl.upsertFromServer` to accept and persist `stockMinimo`.

### `MovimientoSyncService`

**File:** `packages/application/services/movimiento.service.ts`

Implements `ISyncManager`. Dependencies injected: `ISyncQueueRepository`, `DatabaseClient`, `IMovimientoApi` (online).

```ts
interface IMovimientoApi {
  crear(dto: CrearMovimientoDTO): Promise<MovimientoDTO>
  listar(sucursalId?: number): Promise<MovimientoDTO[]>
}

interface CrearMovimientoDTO {
  sucursalId: number
  productoId: number   // server numeric ID
  tipoMovimiento: 'ENTRADA' | 'SALIDA'
  cantidad: number
  referencia?: string
}
```

**`registrar(dto, isOnline)`:**
- If **online**: call `IMovimientoApi.crear(dto)` → on success, update local `inventario.stock_actual` in SQLite (ENTRADA: +cantidad, SALIDA: -cantidad, floor 0)
- If **offline**: apply stock change directly in SQLite → insert row into `movimiento` table (sincronizado=0) → enqueue in `sync_queue`: `{ entity: 'movimiento', operation: 'CREATE', payload: JSON.stringify(dto) }`

**`syncPending()`:**
1. `syncQueueRepo.findPending(50)` filtered by `entity === 'movimiento'`
2. For each: POST to `/api/movimiento/crear` with parsed payload
3. Always call `markAsProcessed(id)` regardless of backend response (server is source of truth; next `pullFromServer` corrects local stock)
4. Increment retries on network error, skip after 3 retries

**`pullFromServer()`:**
1. Get all distinct `sucursal_id` values from local `inventario` table
2. For each: GET `/api/inventario/porSucursal?sucursalId=X` → `upsertFromServer` per item (updates `stock_actual` AND `stock_minimo`)
3. Also trigger product sync via existing `productService.syncPending()`

### `useSyncManager` hook

**File:** `apps/mobile/hormigas_mobile/src/utils/hooks/useSyncManager.ts`

```ts
function useSyncManager(): { isSyncing: boolean; lastSync: Date | null }
```

- Consumes `useNetwork()` and `useSyncQueueStatus()`
- On `isOnline` transition `false → true` AND `pendingCount > 0`: calls `syncPending()` then `pullFromServer()`
- Sets `isSyncing = true` during flush, `false` after
- Records `lastSync` timestamp after successful flush

### `useMovimientos` refactor

Same external contract (`movimientos`, `loading`, `error`, `creating`, `registrar`, `recargar`). Internally:
- Uses `MovimientoSyncService.registrar(dto, isOnline)` instead of direct API call
- If offline: `movimientos` list loaded from local SQLite `movimiento` table (joined with product/branch names via server IDs)
- If online: loads from API as before

### Factory / adapter

**File:** `apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts`

Singleton that wires `MovimientoSyncService` with real dependencies (same pattern as `productServiceInstance.ts`).

---

## Sub-project 2: Low Stock Detection

### Backend — new endpoint

**File:** `hormigas/src/main/java/com/example/hormigas/inventario/controller/InventarioController.java`

```java
@GetMapping("/stockBajo")
public List<InventarioResponseDTO> stockBajo() {
    return inventarioService.obtenerStockBajo();
}
```

**`InventarioService.obtenerStockBajo()`:** queries `WHERE stockActual <= stockMinimo` scoped to `user.empresa`. Uses `InventarioSpecification` with new `stockBajoPredicate`.

### Frontend — `useInventario` hook

**File:** `apps/mobile/hormigas_mobile/src/utils/hooks/useInventario.ts`

```ts
interface InventarioLocal {
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

function useInventario(): {
  lowStockItems: InventarioLocal[]
  loading: boolean
  refresh: () => Promise<void>
}
```

**`refresh()`:**
1. Query local SQLite: `SELECT i.*, p.nombre AS producto_nombre FROM inventario i JOIN producto p ON p.server_id = i.producto_id WHERE i.stock_actual <= i.stock_minimo`
2. If online: also GET `/api/inventario/stockBajo` → upsert results into local SQLite → re-query SQLite
3. Update `lowStockItems` state

**Trigger points:**
- `HomeScreen` calls `refresh()` on mount
- `MovimientoSyncService.registrar()` accepts optional `onMovimientoRegistrado?: () => void` callback — callers pass `refresh` from `useInventario`

---

## Sub-project 3: HomeScreen Real Data

### `MetricsSection`

**File:** `apps/mobile/hormigas_mobile/src/home/components/MetricsSection.tsx`

Receives props instead of using hardcoded arrays:

```ts
interface MetricsSectionProps {
  totalProductos: number
  totalSucursales: number
  pendienteSync: number
}
```

Cards:
- "Total Productos" — `totalProductos`, icon `Package`, color blue
- "Sucursales activas" — `totalSucursales`, icon `Building2`, color green
- "Pendientes sync" — `pendienteSync`, icon `RefreshCw`, color yellow if > 0 else green

Remove: hardcoded `cards[]`, `alerts[]`, `TrendingUp`, `AlertTriangle` entries.

### `LowStockSection`

**File:** `apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx`

Receives props:

```ts
interface LowStockSectionProps {
  items: InventarioLocal[]
  loading: boolean
}
```

- `loading=true` → `ActivityIndicator`
- `items.length === 0` → "Almacenes surtidos" message with `CheckCircle2` green icon
- `items.length > 0` → list showing `productoNombre`, `SKU` (from product lookup), `sucursalNombre`, `stockActual / stockMinimo`

Remove: hardcoded `lowStockProducts[]`.

### `BranchSummaryScreen`

**File:** `apps/mobile/hormigas_mobile/src/home/components/BranchSummaryScreen.tsx`

Receives props:

```ts
interface BranchSummaryProps {
  branches: BranchItemListDTO[]
}
```

Columns: `Sucursal` (nombre), `Responsable` (responsable ?? '—'), `Estado` (activa badge).

Remove: hardcoded `sucursales[]`, columns `totalProductos`, `stockBajo`, `valorInventario`, `movimiento`.

### `HomeScreen`

**File:** `apps/mobile/hormigas_mobile/src/home/screens/HomeScreen.tsx`

```ts
const { products } = useProducts()
const { branches } = useBranches()
const { pendingCount } = useSyncQueueStatus()
const { lowStockItems, loading: loadingStock, refresh: refreshStock } = useInventario()
const { isSyncing } = useSyncManager()

useEffect(() => { refreshStock() }, [])
```

Passes data down as props to each section component. `useSyncManager()` here ensures sync triggers while user is on HomeScreen.

---

## Data flow summary

```
Movement registered (online or offline)
  → MovimientoSyncService.registrar()
  → SQLite inventario.stock_actual updated
  → sync_queue enqueued (if offline)
  → onMovimientoRegistrado() callback → useInventario.refresh()
  → LowStockSection updated

isOnline: false → true AND pendingCount > 0
  → useSyncManager detects transition
  → syncPending() → pullFromServer()
  → SQLite inventario updated with server truth
  → useInventario.refresh() → LowStockSection updated
```

---

## Out of scope

- Conflict resolution beyond "server wins on next pull"
- Movement history pagination offline
- POS app (hormigas_POS) — same patterns apply but separate implementation cycle
- Push notifications for low stock
