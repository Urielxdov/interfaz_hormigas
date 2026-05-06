# POS (Point of Sale) — Design Spec
**Date:** 2026-05-06  
**Status:** Approved

---

## Overview

Build a Point of Sale app (`hormigas_POS`) that allows cashiers to search products by name/SKU, build a multi-product cart, register a cash sale, and calculate change. Follows the same offline-first architecture as `hormigas_mobile` — local SQLite first, sync queue to backend when online.

---

## 1. Backend Changes (`/home/uhernand/hormigas`)

### 1.1 Usuario → Sucursal relationship

Add `@ManyToOne` from `Usuario` to `Sucursal`. Every user is assigned to one branch.

```java
// Usuario.java
@ManyToOne
@JoinColumn(name = "sucursal_id")
private Sucursal sucursal;
```

### 1.2 JWT includes sucursalId

`TokenServiceImpl` adds `sucursalId` claim when generating token:
```java
claims.put("sucursalId", user.getSucursal().getId());
```
`AuthServiceImpl` exposes a `getSucursalIdFromToken(token)` method.

### 1.3 New endpoint — batch sale

```
POST /api/movimiento/venta/batch
Authorization: Bearer <jwt>
```

**Request body:**
```json
{
  "items": [
    { "productoId": 1, "cantidad": 2 },
    { "productoId": 5, "cantidad": 1 }
  ],
  "referencia": "VENTA-<uuid>"
}
```

**Behavior:**
- Extracts `sucursalId` from JWT
- For each item: finds `Inventario(sucursalId, productoId)`, validates stock ≥ cantidad
- Creates one `Movimiento(VENTA)` per item
- Decrements `Inventario.stockActual`
- All within a single `@Transactional` — partial failure rolls back everything

**Response:** `200 OK` with list of created `Movimiento` IDs.  
**Errors:** `409 Conflict` if any item has insufficient stock.

### 1.4 New endpoint — product search with stock

```
GET /api/producto/buscar?q=coca&sucursalId=3
```

Returns products matching `nombre LIKE` or `sku LIKE`, joined with `Inventario` for the given sucursal. Used for initial data pull to populate local SQLite.

---

## 2. Shared Packages (`packages/`)

### 2.1 Domain — new entities

**`packages/domain/entities/sale/Sale.ts`**
```typescript
interface SaleItem {
  productoLocalId: string
  productoServerId?: number
  nombre: string
  sku: string
  precio: number
  cantidad: number
  subtotal: number
}

interface Sale {
  localId: string
  sucursalId: string
  items: SaleItem[]
  total: number
  montoRecibido: number
  cambio: number
  fecha: string
  sincronizado: boolean
}
```

### 2.2 Domain — new SQLite migration

**`packages/infrastructure/db/sqlite/migrations/006_create_sales.ts`**

Tables: `venta` (header) + `venta_item` (line items).

```sql
CREATE TABLE IF NOT EXISTS venta (
  id TEXT PRIMARY KEY,
  sucursal_id TEXT NOT NULL,
  total REAL NOT NULL,
  monto_recibido REAL NOT NULL,
  cambio REAL NOT NULL,
  fecha TEXT NOT NULL,
  sincronizado INTEGER DEFAULT 0
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

### 2.3 Application — SaleService

**`packages/application/services/sale.service.ts`**

```typescript
class SaleService {
  constructor(
    private saleRepo: ISaleRepository,         // local SQLite
    private inventaryRepo: IInventaryRepository, // local SQLite (decrement stock)
    private syncQueueRepo: ISyncQueueRepository,
    private apiSaleRepo: IApiSaleRepository     // batch endpoint
  ) {}

  async registerSale(params: {
    items: CartItem[]
    sucursalId: string
    montoRecibido: number
  }): Promise<Sale>

  async syncPending(): Promise<void>  // pushes VENTA_BATCH queue entries

  async searchProducts(query: string): Promise<ProductWithStock[]>
}
```

**`registerSale` flow:**
1. Compute `subtotal` per item, `total`, `cambio`
2. Decrement `inventario.stockActual` locally for each item
3. Persist `Sale` + `SaleItem` records in SQLite
4. Add one sync queue entry: `{ entity: 'VENTA', operation: 'VENTA_BATCH', payload: JSON(items + referencia) }`

### 2.4 Infrastructure — repositories

- `SqliteSaleRepositoryImpl` — CRUD on `venta` + `venta_item` tables
- `SqliteInventaryRepositoryImpl` — extend with `decrementStock(localId, cantidad)`
- `ApiSaleRepositoryImpl` — calls `POST /api/movimiento/venta/batch`

---

## 3. POS App (`apps/mobile/hormigas_POS`)

### 3.1 Folder structure

```
hormigas_POS/
├── app/
│   ├── _layout.tsx              # Root layout + NetworkProvider + AuthGuard
│   ├── (login)/
│   │   └── index.tsx            # Login screen
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tabs: POS | Historial
│       ├── pos.tsx              # Main POS screen
│       └── history.tsx          # Today's sales history
├── src/
│   ├── adapters/
│   │   ├── ExpoSQLiteClient.ts  # Copy from hormigas_mobile
│   │   ├── AsyncStorageAdapter.ts
│   │   └── saleServiceInstance.ts  # Singleton factory
│   ├── pos/
│   │   ├── hooks/
│   │   │   └── usePOS.ts        # Cart state, search, registerSale
│   │   └── screens/
│   │       └── POSScreen.tsx
│   ├── history/
│   │   └── screens/
│   │       └── HistoryScreen.tsx
│   ├── login/
│   │   └── hooks/
│   │       └── useAuth.ts       # Same as hormigas_mobile + extracts sucursalId from JWT
│   └── utils/
│       └── components/
│           └── SyncQueueBadge.tsx  # Reuse from hormigas_mobile
└── db/
    └── DataBase.ts              # Same DB init pattern
```

### 3.2 POS Screen layout

Single screen, no tabs within POS:

```
┌─────────────────────────────────┐
│ Header: sucursal name + sync badge + wifi
│─────────────────────────────────│
│ [🔍 Buscar por nombre o SKU...] │
│─────────────────────────────────│
│ Resultados (scroll):            │
│  • Coca Cola  $18  stock:24     │
│  • Agua 1L    $12  stock:8      │  ← tap = add to cart
│─────────────────────────────────│
│ CARRITO:                        │
│  Coca Cola x2     $36.00  [−][+]│
│  Agua 1L   x1     $12.00  [−][+]│
│─────────────────────────────────│
│ Total:           $48.00         │
│ Recibido: [____________________]│
│ Cambio:          $2.00          │
│         [  COBRAR  ]            │
└─────────────────────────────────┘
```

- Search filters local SQLite (instant, offline)
- Tapping a result adds to cart (or increments quantity if already in cart)
- `[−][+]` buttons adjust quantity; quantity 0 removes from cart
- `Recibido` input: numeric keyboard, cambio = recibido − total (shows $0.00 if recibido < total)
- `COBRAR` disabled if cart empty or recibido < total

### 3.3 `usePOS` hook

```typescript
function usePOS() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductWithStock[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [montoRecibido, setMontoRecibido] = useState(0)
  const { sucursalId } = useAuth()

  const total = cart.reduce((sum, i) => sum + i.subtotal, 0)
  const cambio = Math.max(0, montoRecibido - total)

  const search = useCallback(async (q: string) => { ... }, [])
  const addToCart = (product: ProductWithStock) => { ... }
  const updateQty = (productoId: string, qty: number) => { ... }
  const cobrar = async () => { ... }  // calls SaleService.registerSale

  return { query, setQuery, results, cart, montoRecibido,
           setMontoRecibido, total, cambio, addToCart, updateQty, cobrar }
}
```

### 3.4 Auth — sucursalId from JWT

`useAuth` decodes the JWT (base64 middle segment) and extracts `sucursalId` claim using `Buffer.from(segment, 'base64').toString()` (React Native — no `atob`).

Returns two values:
- `sucursalServerId: number` — from JWT claim, used for API calls
- `sucursalLocalId: string` — looked up from local `sucursal` table by server ID, used for SQLite queries (inventario JOIN)

On login, `useAuth` runs a one-time lookup: `SELECT local_id FROM sucursal WHERE server_id = ?`.

### 3.5 Sync

Same pattern as `hormigas_mobile`:
- `NetworkContext` detects online state
- When online: `SaleService.syncPending()` runs automatically
- `SyncQueueBadge` shows pending count in header

---

## 4. Data Flow — Offline Sale

```
User taps COBRAR
  → usePOS.cobrar()
  → SaleService.registerSale(items, sucursalId, montoRecibido)
      → Decrement inventario.stockActual in SQLite (each item)
      → INSERT into venta + venta_item (SQLite)
      → INSERT into sync_queue { entity:'VENTA', operation:'VENTA_BATCH', payload: JSON }
      → Return Sale (local)
  → Show success / clear cart

When isOnline = true
  → SaleService.syncPending()
  → Read sync_queue WHERE status='PENDING' AND entity='VENTA'
  → POST /api/movimiento/venta/batch
  → On success: markAsProcessed(id)
  → On failure: incrementRetries(id)
```

---

## 5. Out of Scope

- Partial payments / split payment
- Card payment
- Ticket/receipt printing
- Product creation from POS
- Discount / coupon codes
- Multi-sucursal switching mid-session
