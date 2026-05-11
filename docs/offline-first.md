# Patrón offline-first

El sistema prioriza siempre la base de datos SQLite local. La API es una fuente de verdad secundaria que se consulta cuando hay conexión. El usuario nunca espera a la red para ver datos.

---

## Principio

```
Mostrar datos locales inmediatamente.
Sincronizar con servidor en segundo plano.
Nunca bloquear la UI esperando la red.
```

Esto implica dos flujos separados:

1. **Lectura:** SQLite → UI (siempre), API → SQLite → UI (cuando hay internet)
2. **Escritura (crear/modificar):** SQLite + `sync_queue` → UI (inmediato), API (cuando hay internet)

---

## Ciclo de datos — lectura

```
mount del screen
      │
      ▼
  loadLocal()
  SQLite.findAll()
      │
      ▼
dispatch({ type: 'SET', payload })  ←── UI muestra datos locales
      │
      │  (si isOnline)
      ▼
  syncFromServer()
  API.listar()
      │
      ▼
SQLite.upsertMany()   ← guarda los datos frescos localmente
      │
      ▼
dispatch({ type: 'SET', payload })  ←── UI se actualiza con datos del servidor
```

---

## Ciclo de datos — escritura (productos con sync_queue)

Los productos usan un mecanismo adicional: la `sync_queue`. Esto permite operar completamente offline y sincronizar todos los cambios pendientes cuando regresa la conexión.

```
createProduct(dto)
      │
      ▼
SQLite.save(product, synced=false)
sync_queue.save({ entity: 'producto', operation: 'CREATE', status: 'PENDING' })
      │
      ▼
dispatch({ type: 'CREATE', payload })  ←── UI muestra el producto inmediatamente
      │
      │  (al reconectar)
      ▼
ProductService.syncPending()
  → API.create(payload)
  → HTTP 200 → SQLite.markAsSynced(localId, serverId)
              → sync_queue.markAsProcessed(id)
  → error    → sync_queue.incrementRetries(id)
```

---

## Patrón del hook

Todos los hooks de entidad siguen el mismo patrón. Ejemplo canónico con `useBranches`:

```ts
export function useBranches() {
  const [branches, dispatch] = useReducer(branchReducer, [])
  const { isOnline } = useNetwork()

  // 1. Carga local — siempre, sin importar conexión
  const loadLocal = useCallback(async () => {
    const { sqlite } = await getBranchRepos()
    const data = await sqlite.findAll()
    dispatch({ type: 'SET', payload: data })
  }, [])

  // 2. Sincroniza desde servidor — solo si hay internet
  const syncFromServer = useCallback(async () => {
    const { api, sqlite } = await getBranchRepos()
    const data = await api.listar()
    await sqlite.upsertMany(data)          // persiste localmente
    dispatch({ type: 'SET', payload: data })
  }, [])

  // mount: carga local primero
  useEffect(() => { loadLocal() }, [loadLocal])

  // online: sincroniza (también corre al reconectar)
  useEffect(() => {
    if (!isOnline) return
    syncFromServer().catch(e => console.warn('[useBranches] sync:', e))
  }, [isOnline, syncFromServer])

  // ...mutaciones (createBranch, etc.)
}
```

### Por qué dos `useEffect` separados

- El primero (`loadLocal`) corre en cada mount independientemente del estado de red. Garantiza que el usuario siempre ve algo.
- El segundo (`syncFromServer`) corre cuando `isOnline` cambia a `true`. Eso incluye el mount inicial (si hay internet) y también la reconexión desde offline.

---

## Cola de sincronización (`sync_queue`)

Usada actualmente para **productos** y **ventas**. Permite acumular operaciones mientras no hay conexión y procesarlas en lote al reconectar.

### Esquema

```sql
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,          -- 'producto', 'venta'
  entity_id TEXT NOT NULL,       -- localId del recurso
  operation TEXT NOT NULL,       -- 'CREATE', 'UPDATE', 'DELETE'
  payload TEXT NOT NULL,         -- JSON con los datos a enviar
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | DONE
  retries INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Estados

```
PENDING → (sync exitoso) → DONE
PENDING → (error)        → PENDING (retries++)
```

`syncPending()` procesa hasta 20 items por llamada. Si un item falla, incrementa `retries` y lo deja para el siguiente ciclo.

### Badge de sincronización

El badge en el header consulta `sync_queue` cada 3 segundos (via `useSyncQueueStatus`) y muestra:
- Puntos animados si hay items `PENDING`
- Icono verde si todos están `DONE`

---

## Guía: agregar una nueva entidad

Ejemplo: agregar `Proveedor`.

### 1. Domain — entidad y tabla

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

### 2. Application — DTOs y puertos

```ts
// packages/application/use-cases/supplier/Supplier.dto.ts
export interface CreateProveedorDTO {
  nombre: string
  contacto?: string
}

export interface ProveedorItemDTO {
  id: number
  nombre: string
  contacto?: string
  activo: boolean
}

// packages/application/port/supplier-api.port.ts
export interface IApiProveedorRepository {
  listar(): Promise<ProveedorItemDTO[]>
  crear(dto: CreateProveedorDTO): Promise<ProveedorItemDTO>
}
```

Exportar desde `packages/application/index.ts`.

### 3. Infrastructure — implementaciones

**SQLite:**
```ts
// packages/infrastructure/src/supplier/SqliteProveedorRepositoryImpl.ts
export class SqliteProveedorRepositoryImpl {
  constructor(private db: DatabaseClient) {}

  async findAll(): Promise<ProveedorItemDTO[]> {
    const rows = await this.db.getMany<ProveedorRow>('SELECT * FROM proveedor ORDER BY nombre ASC')
    return rows.map(toDTO)
  }

  async upsertMany(items: ProveedorItemDTO[]): Promise<void> {
    for (const item of items) {
      await this.db.run(
        'INSERT OR REPLACE INTO proveedor (id, nombre, contacto, activo) VALUES (?, ?, ?, ?)',
        [item.id, item.nombre, item.contacto ?? null, item.activo ? 1 : 0]
      )
    }
  }

  async save(dto: CreateProveedorDTO): Promise<ProveedorItemDTO> { ... }
}
```

**API:**
```ts
// packages/infrastructure/src/supplier/ApiProveedorRepositoryImpl.ts
export class ApiProveedorRepositoryImpl implements IApiProveedorRepository {
  constructor(private http: ApiHttpClient) {}

  async listar(): Promise<ProveedorItemDTO[]> {
    return this.http.get('/api/proveedor/listar')
  }

  async crear(dto: CreateProveedorDTO): Promise<ProveedorItemDTO> {
    return this.http.post('/api/proveedor/crear', dto)
  }
}
```

Exportar ambas clases desde `packages/infrastructure/index.ts`.

### 4. App — adapter, reducer, hook

**Adapter singleton:**
```ts
// src/adapters/supplierRepoInstance.ts
export const getSupplierRepos = (): Promise<SupplierRepos> => {
  // mismo patrón que branchRepoInstance.ts
}
```

**Reducer:**
```ts
// src/utils/storage/supplier.reducer.ts
export type SupplierAction =
  | { type: 'SET'; payload: ProveedorItemDTO[] }
  | { type: 'CREATE'; payload: ProveedorItemDTO }
  | { type: 'TOGGLE_STATUS'; payload: number }

export function supplierReducer(state: ProveedorItemDTO[], action: SupplierAction): ProveedorItemDTO[] {
  switch (action.type) {
    case 'SET': return action.payload
    case 'CREATE': return [...state, action.payload]
    case 'TOGGLE_STATUS':
      return state.map(p => p.id === action.payload ? { ...p, activo: !p.activo } : p)
    default: return state
  }
}
```

**Hook:**
```ts
// src/utils/hooks/useProveedores.ts
export function useProveedores() {
  const [proveedores, dispatch] = useReducer(supplierReducer, [])
  const { isOnline } = useNetwork()

  const loadLocal = useCallback(async () => {
    const { sqlite } = await getSupplierRepos()
    dispatch({ type: 'SET', payload: await sqlite.findAll() })
  }, [])

  const syncFromServer = useCallback(async () => {
    const { api, sqlite } = await getSupplierRepos()
    const data = await api.listar()
    await sqlite.upsertMany(data)
    dispatch({ type: 'SET', payload: data })
  }, [])

  useEffect(() => { loadLocal() }, [loadLocal])
  useEffect(() => { if (isOnline) syncFromServer() }, [isOnline, syncFromServer])

  const crear = async (dto: CreateProveedorDTO) => {
    const { api } = await getSupplierRepos()
    const nuevo = await api.crear(dto)
    dispatch({ type: 'CREATE', payload: nuevo })
    return nuevo
  }

  return { proveedores, crear }
}
```

### Checklist completa

- [ ] Entidad en `@hormigas/domain`
- [ ] Tabla en `CREATE_TABLES_SQL`
- [ ] DTOs en `@hormigas/application/use-cases/<entity>/`
- [ ] Puerto en `@hormigas/application/port/<entity>-api.port.ts`
- [ ] Exportar desde `packages/application/index.ts`
- [ ] `Sqlite<Entity>RepositoryImpl` en `@hormigas/infrastructure`
- [ ] `Api<Entity>RepositoryImpl` en `@hormigas/infrastructure`
- [ ] Exportar desde `packages/infrastructure/index.ts`
- [ ] Adapter singleton en `src/adapters/<entity>RepoInstance.ts`
- [ ] Reducer con `SET | CREATE | UPDATE | TOGGLE_STATUS` según necesidad
- [ ] Hook con `loadLocal` + `syncFromServer` + mutations
