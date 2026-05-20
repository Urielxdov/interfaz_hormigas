# Offline Movements, Low Stock Detection & HomeScreen Real Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make movements work offline-first with automatic sync on reconnection, detect low-stock products from local SQLite, and replace all mock data in HomeScreen with live data.

**Architecture:** `MovimientoSyncService` (mirrors `ProductService` pattern) handles offline registration via `sync_queue` and local `inventario` stock updates. `useSyncManager` hook detects reconnection and flushes the queue. `useInventario` hook queries local SQLite for low-stock items and optionally refreshes from a new `GET /api/inventario/stockBajo` backend endpoint. HomeScreen components receive data as props from the parent screen.

**Tech Stack:** React Native / Expo, NativeWind, expo-sqlite, `@hormigas/application` (services/factories), `@hormigas/infrastructure` (SQLite impls), Spring Boot backend (Java).

---

## File Map

### Sub-project 1 — Offline Movement Queue + Sync

| Action | Path |
|--------|------|
| Modify | `packages/infrastructure/src/sale/SqliteInventaryForSaleImpl.ts` |
| Create | `packages/application/services/movimiento.service.ts` |
| Create | `packages/application/factories/createMovimientoService.ts` |
| Modify | `packages/application/index.ts` |
| Create | `apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts` |
| Modify | `apps/mobile/hormigas_mobile/src/movimientos/hooks/useMovimientos.ts` |
| Create | `apps/mobile/hormigas_mobile/src/utils/hooks/useSyncManager.ts` |

### Sub-project 2 — Low Stock Detection

| Action | Path |
|--------|------|
| Modify | `hormigas/src/main/java/com/example/hormigas/inventario/repository/InventarioSpecification.java` |
| Modify | `hormigas/src/main/java/com/example/hormigas/inventario/service/InventarioService.java` |
| Modify | `hormigas/src/main/java/com/example/hormigas/inventario/controller/InventarioController.java` |
| Create | `apps/mobile/hormigas_mobile/src/adapters/inventarioApiInstance.ts` |
| Create | `apps/mobile/hormigas_mobile/src/utils/hooks/useInventario.ts` |

### Sub-project 3 — HomeScreen Real Data

| Action | Path |
|--------|------|
| Modify | `apps/mobile/hormigas_mobile/src/home/components/MetricsSection.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/home/components/BranchSummaryScreen.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/home/screens/HomeScreen.tsx` |

---

## Sub-project 1: Offline Movement Queue + Sync

---

### Task 1: Update `upsertFromServer` to persist `stock_minimo`

**Files:**
- Modify: `packages/infrastructure/src/sale/SqliteInventaryForSaleImpl.ts`

The existing `upsertFromServer` ignores `stockMinimo`. The `inventario` table already has `stock_minimo INTEGER` in `Schema.ts`. This task makes the column actually get populated from server data.

- [ ] **Step 1: Update `upsertFromServer` signature and SQL**

Replace the entire `upsertFromServer` method:

```ts
async upsertFromServer(
  inventarioId: number,
  productoServerId: number,
  sucursalServerId: number,
  stockActual: number,
  stockMinimo: number = 0,
  stockMaximo: number = 9999
): Promise<void> {
  await this.db.run(
    `INSERT OR REPLACE INTO inventario (id, producto_id, sucursal_id, stock_actual, stock_minimo, stock_maximo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [inventarioId, productoServerId, sucursalServerId, stockActual, stockMinimo, stockMaximo]
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/infrastructure/src/sale/SqliteInventaryForSaleImpl.ts
git commit -m "fix(infra): persist stock_minimo in upsertFromServer"
```

---

### Task 2: Create `MovimientoSyncService`

**Files:**
- Create: `packages/application/services/movimiento.service.ts`

This service handles both online and offline movement registration, following the same pattern as `ProductService`. Offline: updates local `inventario.stock_actual`, enqueues in `sync_queue`. Online: calls API, then updates local stock. `syncPending` flushes the queue. `pullFromServer` fetches inventory per branch and calls `upsertFromServer`.

- [ ] **Step 1: Create the service file**

Create `packages/application/services/movimiento.service.ts`:

```ts
import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { generateUUID } from '../utils/uuid'

export interface CrearMovimientoDTO {
  sucursalId: number
  productoId: number
  tipoMovimiento: 'ENTRADA' | 'SALIDA'
  cantidad: number
  referencia?: string
}

export interface MovimientoDTO {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  tipoMovimiento: 'ENTRADA' | 'SALIDA'
  cantidad: number
  usuarioNombre: string
  referencia?: string
  fecha: string
}

export interface InventarioResponseDTO {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

export interface IMovimientoApi {
  crear(dto: CrearMovimientoDTO): Promise<MovimientoDTO>
  listar(sucursalId?: number): Promise<MovimientoDTO[]>
  stockBajo(): Promise<InventarioResponseDTO[]>
  inventarioPorSucursal(sucursalId: number): Promise<InventarioResponseDTO[]>
}

export interface IInventarioLocalRepo {
  upsertFromServer(
    inventarioId: number,
    productoServerId: number,
    sucursalServerId: number,
    stockActual: number,
    stockMinimo: number,
    stockMaximo: number
  ): Promise<void>
  applyMovement(productoServerId: number, sucursalServerId: number, tipo: 'ENTRADA' | 'SALIDA', cantidad: number): Promise<void>
  getSucursalIds(): Promise<number[]>
  getLowStockItems(): Promise<InventarioLocalRow[]>
}

export interface InventarioLocalRow {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

export class MovimientoSyncService {
  constructor(
    private syncQueueRepo: ISyncQueueRepository,
    private inventarioRepo: IInventarioLocalRepo,
    private api: IMovimientoApi
  ) {}

  async registrar(dto: CrearMovimientoDTO, isOnline: boolean): Promise<MovimientoDTO | null> {
    if (isOnline) {
      const result = await this.api.crear(dto)
      await this.inventarioRepo.applyMovement(dto.productoId, dto.sucursalId, dto.tipoMovimiento, dto.cantidad)
      return result
    }

    // Offline: update local stock and enqueue
    await this.inventarioRepo.applyMovement(dto.productoId, dto.sucursalId, dto.tipoMovimiento, dto.cantidad)

    const item: SyncQueueItem = {
      id: generateUUID(),
      entity: 'movimiento',
      entityId: generateUUID(),
      operation: 'CREATE',
      payload: JSON.stringify(dto),
      status: 'PENDING',
      retries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await this.syncQueueRepo.save(item)
    return null
  }

  async listar(sucursalId?: number): Promise<MovimientoDTO[]> {
    return this.api.listar(sucursalId)
  }

  async syncPending(): Promise<void> {
    const pending = await this.syncQueueRepo.findPending(50)
    for (const item of pending) {
      if (item.entity !== 'movimiento') continue
      try {
        const dto = JSON.parse(item.payload) as CrearMovimientoDTO
        await this.api.crear(dto)
      } catch {
        await this.syncQueueRepo.incrementRetries(item.id)
        continue
      }
      await this.syncQueueRepo.markAsProcessed(item.id)
    }
  }

  async pullFromServer(): Promise<void> {
    const sucursalIds = await this.inventarioRepo.getSucursalIds()
    for (const sucursalId of sucursalIds) {
      try {
        const items = await this.api.inventarioPorSucursal(sucursalId)
        for (const item of items) {
          await this.inventarioRepo.upsertFromServer(
            item.id, item.productoId, item.sucursalId,
            item.stockActual, item.stockMinimo, item.stockMaximo
          )
        }
      } catch {
        console.warn(`[MovimientoSyncService] pullFromServer falló para sucursal ${sucursalId}`)
      }
    }
  }

  async getLowStockItems(): Promise<InventarioLocalRow[]> {
    return this.inventarioRepo.getLowStockItems()
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/application/services/movimiento.service.ts
git commit -m "feat(application): add MovimientoSyncService with offline queue support"
```

---

### Task 3: Create `IInventarioLocalRepo` SQLite implementation

**Files:**
- Modify: `packages/infrastructure/src/sale/SqliteInventaryForSaleImpl.ts`

Add the methods required by `IInventarioLocalRepo` to the existing class.

- [ ] **Step 1: Add `applyMovement`, `getSucursalIds`, `getLowStockItems` to `SqliteInventaryForSaleImpl`**

Add these methods to the class in `packages/infrastructure/src/sale/SqliteInventaryForSaleImpl.ts`:

```ts
async applyMovement(
  productoServerId: number,
  sucursalServerId: number,
  tipo: 'ENTRADA' | 'SALIDA',
  cantidad: number
): Promise<void> {
  const delta = tipo === 'ENTRADA' ? cantidad : -cantidad
  await this.db.run(
    `UPDATE inventario
     SET stock_actual = MAX(0, stock_actual + ?)
     WHERE producto_id = ? AND sucursal_id = ?`,
    [delta, productoServerId, sucursalServerId]
  )
}

async getSucursalIds(): Promise<number[]> {
  const rows = await this.db.getMany<{ sucursal_id: number }>(
    `SELECT DISTINCT sucursal_id FROM inventario`
  )
  return rows.map(r => r.sucursal_id)
}

async getLowStockItems(): Promise<{
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}[]> {
  const rows = await this.db.getMany<{
    id: number
    producto_id: number
    producto_nombre: string
    sucursal_id: number
    sucursal_nombre: string
    stock_actual: number
    stock_minimo: number
    stock_maximo: number
  }>(
    `SELECT i.id, i.producto_id, COALESCE(p.nombre, 'Producto #' || i.producto_id) AS producto_nombre,
            i.sucursal_id, COALESCE(s.nombre, 'Sucursal #' || i.sucursal_id) AS sucursal_nombre,
            i.stock_actual, i.stock_minimo, i.stock_maximo
     FROM inventario i
     LEFT JOIN producto p ON p.server_id = i.producto_id
     LEFT JOIN sucursal s ON s.id = i.sucursal_id
     WHERE i.stock_minimo IS NOT NULL AND i.stock_actual <= i.stock_minimo`
  )
  return rows.map(r => ({
    id: r.id,
    productoId: r.producto_id,
    productoNombre: r.producto_nombre,
    sucursalId: r.sucursal_id,
    sucursalNombre: r.sucursal_nombre,
    stockActual: r.stock_actual,
    stockMinimo: r.stock_minimo,
    stockMaximo: r.stock_maximo,
  }))
}
```

- [ ] **Step 2: Export `SqliteInventaryForSaleImpl` implements `IInventarioLocalRepo`**

At the top of `SqliteInventaryForSaleImpl.ts`, import and implement the interface:

```ts
import { IInventarioLocalRepo } from '@hormigas/application'
```

Change the class declaration:

```ts
export class SqliteInventaryForSaleImpl implements ILocalInventaryRepository, IInventarioLocalRepo {
```

- [ ] **Step 3: Commit**

```bash
git add packages/infrastructure/src/sale/SqliteInventaryForSaleImpl.ts
git commit -m "feat(infra): add applyMovement, getSucursalIds, getLowStockItems to SqliteInventaryForSaleImpl"
```

---

### Task 4: Create factory and update application exports

**Files:**
- Create: `packages/application/factories/createMovimientoService.ts`
- Modify: `packages/application/index.ts`

- [ ] **Step 1: Create factory**

Create `packages/application/factories/createMovimientoService.ts`:

```ts
import { ISyncQueueRepository } from '../sync/sync.interfaces'
import { MovimientoSyncService, IMovimientoApi, IInventarioLocalRepo } from '../services/movimiento.service'

export const createMovimientoService = (
  syncQueueRepo: ISyncQueueRepository,
  inventarioRepo: IInventarioLocalRepo,
  api: IMovimientoApi
): MovimientoSyncService => {
  return new MovimientoSyncService(syncQueueRepo, inventarioRepo, api)
}
```

- [ ] **Step 2: Add exports to `packages/application/index.ts`**

Append to `packages/application/index.ts`:

```ts
// Movimiento
export * from './services/movimiento.service'
export * from './factories/createMovimientoService'
```

- [ ] **Step 3: Commit**

```bash
git add packages/application/factories/createMovimientoService.ts packages/application/index.ts
git commit -m "feat(application): export MovimientoSyncService factory"
```

---

### Task 5: Create `movimientoServiceInstance` adapter singleton

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts`

Wires `MovimientoSyncService` with real dependencies (same pattern as `productServiceInstance.ts`). The `IMovimientoApi` impl wraps existing `movimientoApiInstance` and adds `stockBajo` + `inventarioPorSucursal`.

- [ ] **Step 1: Create adapter**

Create `apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts`:

```ts
import { ApiHttpClient, SqliteSyncQueueRepositoryImpl, SqliteInventaryForSaleImpl, TokenServiceImpl } from '@hormigas/infrastructure'
import { createMovimientoService, MovimientoSyncService, IMovimientoApi, MovimientoDTO, CrearMovimientoDTO, InventarioResponseDTO } from '@hormigas/application'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _service: MovimientoSyncService | null = null
let _initPromise: Promise<MovimientoSyncService> | null = null

export const getMovimientoService = (): Promise<MovimientoSyncService> => {
  if (_service) return Promise.resolve(_service)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const db = await getDB()
    const dbClient = new ExpoSQLiteClient(db)
    const tokenService = new TokenServiceImpl(storage)
    const http = new ApiHttpClient(API_URL, tokenService)

    const syncQueueRepo = new SqliteSyncQueueRepositoryImpl(dbClient)
    const inventarioRepo = new SqliteInventaryForSaleImpl(dbClient)

    const api: IMovimientoApi = {
      crear: (dto: CrearMovimientoDTO) =>
        http.post<MovimientoDTO>('/api/movimiento/crear', dto),
      listar: (sucursalId?: number) => {
        const params = sucursalId != null ? `?sucursalId=${sucursalId}` : ''
        return http.get<MovimientoDTO[]>(`/api/movimiento/buscar${params}`)
      },
      stockBajo: () =>
        http.get<InventarioResponseDTO[]>('/api/inventario/stockBajo'),
      inventarioPorSucursal: (sucursalId: number) =>
        http.get<InventarioResponseDTO[]>(`/api/inventario/porSucursal?sucursalId=${sucursalId}`),
    }

    _service = createMovimientoService(syncQueueRepo, inventarioRepo, api)
    return _service
  })()

  return _initPromise
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts
git commit -m "feat(mobile): add movimientoServiceInstance singleton adapter"
```

---

### Task 6: Refactor `useMovimientos` hook

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/movimientos/hooks/useMovimientos.ts`

Same external contract. Internally delegates to `MovimientoSyncService`. When offline, `listar` returns empty (movements are API-only for read). Pending items visible via `useSyncQueueStatus` badge.

- [ ] **Step 1: Rewrite `useMovimientos.ts`**

Replace the entire file:

```ts
import { useCallback, useEffect, useState } from 'react'
import { MovimientoDTO, CrearMovimientoDTO } from '@hormigas/application'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getMovimientoService } from '@/src/adapters/movimientoServiceInstance'

export function useMovimientos(sucursalId?: number, onMovimientoRegistrado?: () => void) {
  const [movimientos, setMovimientos] = useState<MovimientoDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const { isOnline } = useNetwork()

  const cargar = useCallback(async () => {
    if (!isOnline) return
    setLoading(true)
    setError(null)
    try {
      const svc = await getMovimientoService()
      const data = await svc.listar(sucursalId)
      setMovimientos(data)
    } catch {
      setError('Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }, [isOnline, sucursalId])

  useEffect(() => { cargar() }, [cargar])

  const registrar = async (dto: CrearMovimientoDTO) => {
    setCreating(true)
    try {
      const svc = await getMovimientoService()
      const result = await svc.registrar(dto, isOnline)
      if (result) setMovimientos(prev => [result, ...prev])
      onMovimientoRegistrado?.()
      return result
    } finally {
      setCreating(false)
    }
  }

  return { movimientos, loading, error, creating, registrar, recargar: cargar }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/movimientos/hooks/useMovimientos.ts
git commit -m "feat(movimientos): offline-first registration via MovimientoSyncService"
```

---

### Task 7: Create `useSyncManager` hook

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/utils/hooks/useSyncManager.ts`

Detects `isOnline` transition `false → true` with pending queue items and triggers `syncPending()` → `pullFromServer()`.

- [ ] **Step 1: Create hook**

Create `apps/mobile/hormigas_mobile/src/utils/hooks/useSyncManager.ts`:

```ts
import { useEffect, useRef, useState } from 'react'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { useSyncQueueStatus } from './useSyncQueueStatus'
import { getMovimientoService } from '@/src/adapters/movimientoServiceInstance'

export function useSyncManager() {
  const { isOnline } = useNetwork()
  const { pendingCount } = useSyncQueueStatus()
  const prevOnlineRef = useRef(isOnline)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const wentOnline = isOnline && !prevOnlineRef.current
    prevOnlineRef.current = isOnline

    if (!wentOnline || pendingCount === 0) return

    const run = async () => {
      setIsSyncing(true)
      try {
        const svc = await getMovimientoService()
        await svc.syncPending()
        await svc.pullFromServer()
        setLastSync(new Date())
      } catch (e) {
        console.warn('[useSyncManager] sync failed:', e)
      } finally {
        setIsSyncing(false)
      }
    }

    run()
  }, [isOnline, pendingCount])

  return { isSyncing, lastSync }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/hooks/useSyncManager.ts
git commit -m "feat(mobile): add useSyncManager — auto-flush queue on reconnect"
```

---

## Sub-project 2: Low Stock Detection

---

### Task 8: Add `obtenerStockBajo` to backend

**Files:**
- Modify: `hormigas/src/main/java/com/example/hormigas/inventario/repository/InventarioSpecification.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/inventario/service/InventarioService.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/inventario/controller/InventarioController.java`

- [ ] **Step 1: Add `stockBajoPredicate` to `InventarioSpecification`**

Add this method to `InventarioSpecification.java`:

```java
public static Specification<Inventario> stockBajoPorEmpresa(Long empresaId) {
    return (root, query, cb) -> {
        var empresa = cb.equal(
            root.get("producto").get("empresa").get("id"), empresaId
        );
        var stockBajo = cb.lessThanOrEqualTo(
            root.get("stockActual"), root.get("stockMinimo")
        );
        var tieneMinimo = cb.isNotNull(root.get("stockMinimo"));
        return cb.and(empresa, tieneMinimo, stockBajo);
    };
}
```

- [ ] **Step 2: Add `obtenerStockBajo()` to `InventarioService`**

Add this method to `InventarioService.java`:

```java
public List<InventarioResponseDTO> obtenerStockBajo() {
    Usuario user = usuarioService.getUsuarioLogueado();
    List<Inventario> inventarios = inventarioRepository.findAll(
        InventarioSpecification.stockBajoPorEmpresa(user.getEmpresa().getId())
    );
    return inventarios.stream()
        .map(InventarioMapper::toResponseInventario)
        .toList();
}
```

- [ ] **Step 3: Add `/stockBajo` endpoint to `InventarioController`**

Add this method to `InventarioController.java`:

```java
@GetMapping("/stockBajo")
public List<InventarioResponseDTO> stockBajo() {
    return inventarioService.obtenerStockBajo();
}
```

- [ ] **Step 4: Verify backend compiles**

```bash
cd /home/uhernand/hormigas && ./mvnw compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git -C /home/uhernand/hormigas add src/main/java/com/example/hormigas/inventario/
git -C /home/uhernand/hormigas commit -m "feat(api): add GET /api/inventario/stockBajo endpoint"
```

---

### Task 9: Create `inventarioApiInstance` and `useInventario` hook

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/adapters/inventarioApiInstance.ts`
- Create: `apps/mobile/hormigas_mobile/src/utils/hooks/useInventario.ts`

- [ ] **Step 1: Create `inventarioApiInstance.ts`**

Create `apps/mobile/hormigas_mobile/src/adapters/inventarioApiInstance.ts`:

```ts
import { ApiHttpClient, TokenServiceImpl, SqliteInventaryForSaleImpl } from '@hormigas/infrastructure'
import { InventarioResponseDTO } from '@hormigas/application'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

export type InventarioLocalItem = {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

type InventarioApi = {
  stockBajo(): Promise<InventarioResponseDTO[]>
}

let _api: InventarioApi | null = null

export const getInventarioApi = (): InventarioApi => {
  if (_api) return _api
  const tokenService = new TokenServiceImpl(storage)
  const http = new ApiHttpClient(API_URL, tokenService)
  _api = {
    stockBajo: () => http.get<InventarioResponseDTO[]>('/api/inventario/stockBajo'),
  }
  return _api
}

export const getInventarioLocalRepo = async (): Promise<SqliteInventaryForSaleImpl> => {
  const db = await getDB()
  const dbClient = new ExpoSQLiteClient(db)
  return new SqliteInventaryForSaleImpl(dbClient)
}
```

- [ ] **Step 2: Create `useInventario.ts`**

Create `apps/mobile/hormigas_mobile/src/utils/hooks/useInventario.ts`:

```ts
import { useCallback, useState } from 'react'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getInventarioApi, getInventarioLocalRepo, InventarioLocalItem } from '@/src/adapters/inventarioApiInstance'

export function useInventario() {
  const [lowStockItems, setLowStockItems] = useState<InventarioLocalItem[]>([])
  const [loading, setLoading] = useState(false)
  const { isOnline } = useNetwork()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const localRepo = await getInventarioLocalRepo()

      if (isOnline) {
        const serverItems = await getInventarioApi().stockBajo()
        for (const item of serverItems) {
          await localRepo.upsertFromServer(
            item.id, item.productoId, item.sucursalId,
            item.stockActual, item.stockMinimo, item.stockMaximo
          )
        }
      }

      const items = await localRepo.getLowStockItems()
      setLowStockItems(items)
    } catch (e) {
      console.warn('[useInventario] refresh failed:', e)
    } finally {
      setLoading(false)
    }
  }, [isOnline])

  return { lowStockItems, loading, refresh }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/adapters/inventarioApiInstance.ts \
        apps/mobile/hormigas_mobile/src/utils/hooks/useInventario.ts
git commit -m "feat(mobile): add inventarioApiInstance and useInventario hook for low-stock"
```

---

## Sub-project 3: HomeScreen Real Data

---

### Task 10: Refactor `MetricsSection` with real data props

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/home/components/MetricsSection.tsx`

Remove all hardcoded arrays. Accept props. Show 3 real metric cards.

- [ ] **Step 1: Rewrite `MetricsSection.tsx`**

Replace the entire file:

```tsx
import InformationCard from '@/src/utils/components/InformationCard'
import { Building2, Package, RefreshCw } from 'lucide-react-native'
import { View, Text } from 'react-native'

interface MetricsSectionProps {
  totalProductos: number
  totalSucursales: number
  pendienteSync: number
}

export default function MetricsSection({ totalProductos, totalSucursales, pendienteSync }: MetricsSectionProps) {
  return (
    <View className='gap-3'>
      <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50 text-base'>Resumen</Text>
      <View className='flex-row gap-3'>
        <View className='flex-1'>
          <InformationCard
            title='Productos'
            description={String(totalProductos)}
            icon={Package}
            iconBgColor='blue'
          />
        </View>
        <View className='flex-1'>
          <InformationCard
            title='Sucursales'
            description={String(totalSucursales)}
            icon={Building2}
            iconBgColor='green'
          />
        </View>
      </View>
      <InformationCard
        title='Pendientes de sync'
        description={pendienteSync > 0 ? `${pendienteSync} movimiento(s)` : 'Todo sincronizado'}
        icon={RefreshCw}
        iconBgColor={pendienteSync > 0 ? 'yellow' : 'green'}
      />
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/home/components/MetricsSection.tsx
git commit -m "feat(home): MetricsSection accepts real data props, removes mock arrays"
```

---

### Task 11: Refactor `LowStockSection` with real data

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx`

Remove hardcoded products. Accept `items` + `loading` props. Show "Almacenes surtidos" when empty.

- [ ] **Step 1: Rewrite `LowStockSection.tsx`**

Replace the entire file:

```tsx
import { ActivityIndicator, View, Text } from 'react-native'
import { AlertTriangle, CheckCircle2 } from 'lucide-react-native'
import { InventarioLocalItem } from '@/src/adapters/inventarioApiInstance'

interface LowStockSectionProps {
  items: InventarioLocalItem[]
  loading: boolean
}

export default function LowStockSection({ items, loading }: LowStockSectionProps) {
  return (
    <View className='bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 gap-3'>
      <View className='flex-row items-center gap-2'>
        <AlertTriangle size={16} color='#f59e0b' />
        <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>Stock bajo</Text>
      </View>

      {loading && <ActivityIndicator />}

      {!loading && items.length === 0 && (
        <View className='flex-row items-center gap-2 py-2'>
          <CheckCircle2 size={16} color='#22c55e' />
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>Almacenes surtidos</Text>
        </View>
      )}

      {!loading && items.map(item => (
        <View
          key={`${item.productoId}-${item.sucursalId}`}
          className='flex-row items-center justify-between border-b border-stone-50 dark:border-zinc-800 pb-2'
        >
          <View className='flex-1'>
            <Text className='font-sans-medium text-zinc-800 dark:text-zinc-200 text-sm'>
              {item.productoNombre}
            </Text>
            <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>
              {item.sucursalNombre}
            </Text>
          </View>
          <View className='bg-red-100 dark:bg-red-900/30 rounded-full px-2 py-0.5'>
            <Text className='font-sans-semibold text-red-700 dark:text-red-400 text-xs'>
              {item.stockActual} / {item.stockMinimo}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx
git commit -m "feat(home): LowStockSection uses real inventory data, shows Almacenes surtidos"
```

---

### Task 12: Refactor `BranchSummaryScreen` with real data

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/home/components/BranchSummaryScreen.tsx`

Remove mock `sucursales` array. Accept `branches: BranchItemListDTO[]` prop. Show only columns that have real data.

- [ ] **Step 1: Rewrite `BranchSummaryScreen.tsx`**

Replace the entire file:

```tsx
import DataTable from '@/src/utils/components/DataTable'
import { BranchItemListDTO } from '@hormigas/application'
import { Building2 } from 'lucide-react-native'
import { Text, View } from 'react-native'

interface BranchSummaryProps {
  branches: BranchItemListDTO[]
}

export default function BranchSummaryScreen({ branches }: BranchSummaryProps) {
  return (
    <DataTable
      title='Sucursales'
      description='Estado de cada ubicación'
      icon={Building2}
      columns={[
        {
          key: 'nombre',
          label: 'Sucursal',
          render: val => (
            <View className='flex-row items-center gap-1'>
              <View className='rounded-xl bg-blue-100 p-1'>
                <Building2 size={18} color='#1d4ed8' />
              </View>
              <Text className='font-sans text-zinc-800 dark:text-zinc-200 text-sm'>{val}</Text>
            </View>
          ),
        },
        {
          key: 'responsable',
          label: 'Responsable',
          render: val => (
            <Text className='font-sans text-zinc-600 dark:text-zinc-400 text-sm'>
              {val ?? '—'}
            </Text>
          ),
        },
        {
          key: 'activa',
          label: 'Estado',
          render: val => (
            <View className={`rounded-xl px-2 py-0.5 self-start ${val ? 'bg-green-100' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              <Text className={`font-sans-semibold text-xs ${val ? 'text-green-700' : 'text-zinc-500'}`}>
                {val ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
          ),
        },
      ]}
      data={branches.map(b => ({
        nombre: b.nombre,
        responsable: b.responsable,
        activa: b.activa,
      }))}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/home/components/BranchSummaryScreen.tsx
git commit -m "feat(home): BranchSummaryScreen uses real branches prop, removes mock data"
```

---

### Task 13: Wire `HomeScreen` with all hooks

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/home/screens/HomeScreen.tsx`

Instantiate all hooks here, pass data down as props, trigger `refreshStock` on mount, and activate `useSyncManager` so reconnection triggers sync.

- [ ] **Step 1: Rewrite `HomeScreen.tsx`**

Replace the entire file:

```tsx
import MetricsSection from '@/src/home/components/MetricsSection'
import LowStockSection from '@/src/home/components/LowStockSection'
import BranchSummaryScreen from '@/src/home/components/BranchSummaryScreen'
import { useAuth } from '@/src/login/hooks/useAuth'
import { useProducts } from '@/src/utils/hooks/useProducts'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { useSyncQueueStatus } from '@/src/utils/hooks/useSyncQueueStatus'
import { useInventario } from '@/src/utils/hooks/useInventario'
import { useSyncManager } from '@/src/utils/hooks/useSyncManager'
import { router } from 'expo-router'
import { LogOut } from 'lucide-react-native'
import { useCallback, useEffect } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

export default function HomeScreen() {
  const { logout } = useAuth()
  const { products } = useProducts()
  const { branches } = useBranches()
  const { pendingCount } = useSyncQueueStatus()
  const { lowStockItems, loading: loadingStock, refresh: refreshStock } = useInventario()
  useSyncManager()

  // Refresh stock on first mount and whenever the screen regains focus
  // (e.g. after navigating back from MovimientosScreen)
  useFocusEffect(useCallback(() => { refreshStock() }, []))

  const handleLogout = async () => {
    await logout()
    router.replace('/(login)')
  }

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      <View className='bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 flex-row items-center justify-between'>
        <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Inicio</Text>
        <TouchableOpacity onPress={handleLogout} className='p-2'>
          <LogOut size={20} color='#71717a' />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
        <MetricsSection
          totalProductos={products.filter(p => p.estado).length}
          totalSucursales={branches.filter(b => b.activa).length}
          pendienteSync={pendingCount}
        />
        <LowStockSection items={lowStockItems} loading={loadingStock} />
        <BranchSummaryScreen branches={branches} />
      </ScrollView>
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/home/screens/HomeScreen.tsx
git commit -m "feat(home): wire HomeScreen with real data hooks, remove all mock data"
```

---

## Verification checklist

After all tasks are complete, verify end-to-end:

- [ ] **Offline movement**: Put device in airplane mode → register a movement in MovimientosScreen → confirm `useSyncQueueStatus` shows +1 pending → inventario SQLite updated locally
- [ ] **Reconnect sync**: Re-enable network → confirm pending count drops to 0 → confirm backend has the movement
- [ ] **Low stock**: In backend, set a product's `stockMinimo > stockActual` → open HomeScreen → LowStockSection shows that product
- [ ] **Almacenes surtidos**: All products above minimum → HomeScreen shows "Almacenes surtidos"
- [ ] **HomeScreen metrics**: Total productos and sucursales match real counts, not mock values
