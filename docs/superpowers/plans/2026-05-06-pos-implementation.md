# POS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full offline-first POS (Point of Sale) in `hormigas_POS` that searches products locally, builds a multi-product cart, registers cash sales with change calculation, and syncs to the backend when online.

**Architecture:** Local-first SQLite (same schema as `hormigas_mobile`), sync queue for pending sales, batch endpoint `POST /api/movimiento/venta/batch` syncs when online. `sucursalId` embedded in JWT — no separate lookup needed since local `inventario.sucursal_id` stores the server's numeric ID directly.

**Tech Stack:** Spring Boot (backend), TypeScript monorepo packages (`@hormigas/domain/application/infrastructure`), Expo + React Native (POS app), SQLite, `@expo/vector-icons` Ionicons, React Native StyleSheet (no NativeWind in POS).

---

## Task 1: Backend — Add sucursal to Usuario + JWT claim

**Files:**
- Modify: `hormigas/src/main/java/com/example/hormigas/security/domain/Usuario.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/security/application/services/TokenServiceImpl.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/security/infrastructure/dtos/CreateUsuarioDTO.java`

- [ ] **Step 1: Add `sucursal` field to `Usuario.java`**

Add after the `empresa` field (line ~28):
```java
import com.example.hormigas.sucursal.entity.Sucursal;
// ... (add to existing imports)

@ManyToOne(optional = true)
@JoinColumn(
    name = "sucursal_id",
    foreignKey = @ForeignKey(name = "fk_usuario_sucursal")
)
private Sucursal sucursal;
```

Add getter and setter after `setEmpresa`:
```java
public Sucursal getSucursal() {
    return sucursal;
}

public void setSucursal(Sucursal sucursal) {
    this.sucursal = sucursal;
}
```

- [ ] **Step 2: Add `sucursalId` claim to JWT in `TokenServiceImpl.java`**

In `generateToken()`, after the `empresaId` claim, add:
```java
.claim("sucursalId", usuario.getSucursal() != null ? usuario.getSucursal().getId() : null)
```

Full `JwtClaimsSet` block becomes:
```java
JwtClaimsSet claims = JwtClaimsSet.builder()
        .subject(usuario.getCorreo())
        .issuedAt(now)
        .expiresAt(now.plus(expiration, ChronoUnit.MINUTES))
        .claim("roles", roles)
        .claim("id", usuario.getId())
        .claim("empresaId", usuario.getEmpresa().getId())
        .claim("sucursalId", usuario.getSucursal() != null ? usuario.getSucursal().getId() : null)
        .build();
```

- [ ] **Step 3: Add `sucursalId` to `CreateUsuarioDTO.java`**

```java
package com.example.hormigas.security.infrastructure.dtos;

public record CreateUsuarioDTO(
        String correo,
        String password,
        String nombre,
        Long empresaId,
        Long sucursalId
) {}
```

- [ ] **Step 4: Update `AuthController` (or wherever `CreateUsuarioDTO` is consumed) to set the sucursal on the user**

Find the controller/service that uses `CreateUsuarioDTO`. In `UsuarioController.java` or `AuthServiceImpl.java`, after setting empresa, add:

```java
import com.example.hormigas.sucursal.repository.SucursalRepository;
// inject SucursalRepository via constructor

if (dto.sucursalId() != null) {
    sucursalRepository.findById(dto.sucursalId())
        .ifPresent(usuario::setSucursal);
}
```

- [ ] **Step 5: Restart backend and verify JWT**

Start backend: `cd /home/uhernand/hormigas && ./mvnw spring-boot:run`

Login via curl and decode the JWT middle segment to confirm `sucursalId` is present:
```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"test@test.com","password":"pass"}' | \
  python3 -c "import sys,json,base64; t=json.load(sys.stdin)['token']; p=t.split('.')[1]+'=='; print(json.loads(base64.b64decode(p)))"
```
Expected: JSON with `"sucursalId": <number>`.

- [ ] **Step 6: Commit**
```bash
git add hormigas/src/main/java/com/example/hormigas/security/
git commit -m "feat(backend): add sucursal to Usuario and include sucursalId in JWT"
```

---

## Task 2: Backend — Product search with stock endpoint

**Files:**
- Create: `hormigas/src/main/java/com/example/hormigas/producto/dto/ProductoConStockDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/producto/repository/ProductoRepository.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/producto/service/ProductoService.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/producto/controller/ProductoController.java`

- [ ] **Step 1: Create `ProductoConStockDTO.java`**

```java
package com.example.hormigas.producto.dto;

import java.math.BigDecimal;

public record ProductoConStockDTO(
        Long id,
        Long inventarioId,
        String nombre,
        String sku,
        BigDecimal precio,
        int stockActual
) {}
```

- [ ] **Step 2: Add search query to `ProductoRepository.java`**

Add this method to the existing interface:
```java
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Query("""
    SELECT p FROM Producto p
    WHERE p.empresa.id = :empresaId
    AND p.activo = true
    AND (LOWER(p.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
      OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :q, '%')))
    ORDER BY p.nombre ASC
""")
List<Producto> buscarPorNombreOSku(@Param("q") String q, @Param("empresaId") Long empresaId);
```

- [ ] **Step 3: Add `buscarConStock` to `ProductoService.java`**

Add `InventarioRepository` injection (constructor) and the new method. Add to constructor params:
```java
private final InventarioRepository inventarioRepository;
// add to constructor signature and assignment
```

Add method:
```java
import com.example.hormigas.producto.dto.ProductoConStockDTO;
import com.example.hormigas.security.domain.services.UsuarioService;

public List<ProductoConStockDTO> buscarConStock(String q, Long sucursalId) {
    Usuario user = usuarioService.getUsuarioLogueado();
    List<Producto> productos = productoRepository.buscarPorNombreOSku(
        q == null ? "" : q, user.getEmpresa().getId()
    );
    return productos.stream().map(p -> {
        int stock = inventarioRepository
            .findBySucursalIdAndProductoId(sucursalId, p.getId())
            .map(inv -> { /* capture inventarioId */ return inv; })
            .map(inv -> inv.getStockActual())
            .orElse(0);
        Long inventarioId = inventarioRepository
            .findBySucursalIdAndProductoId(sucursalId, p.getId())
            .map(inv -> inv.getId())
            .orElse(null);
        return new ProductoConStockDTO(p.getId(), inventarioId, p.getNombre(), p.getSku(), p.getPrecio(), stock);
    }).toList();
}
```

Actually, write it cleaner to avoid double query:
```java
public List<ProductoConStockDTO> buscarConStock(String q, Long sucursalId) {
    Usuario user = usuarioService.getUsuarioLogueado();
    List<Producto> productos = productoRepository.buscarPorNombreOSku(
        q == null ? "" : q, user.getEmpresa().getId()
    );
    return productos.stream().map(p ->
        inventarioRepository
            .findBySucursalIdAndProductoId(sucursalId, p.getId())
            .map(inv -> new ProductoConStockDTO(
                p.getId(), inv.getId(), p.getNombre(), p.getSku(), p.getPrecio(), inv.getStockActual()
            ))
            .orElse(new ProductoConStockDTO(p.getId(), null, p.getNombre(), p.getSku(), p.getPrecio(), 0))
    ).toList();
}
```

Also inject `UsuarioService` if not already present. Check current `ProductoService` constructor and add if missing.

- [ ] **Step 4: Add endpoint to `ProductoController.java`**

Add import and inject `ProductoService` (already injected). Add endpoint:
```java
import com.example.hormigas.producto.dto.ProductoConStockDTO;
import java.util.List;

@GetMapping("/buscar")
public List<ProductoConStockDTO> buscarConStock(
        @RequestParam(required = false, defaultValue = "") String q,
        @RequestParam Long sucursalId) {
    return productoService.buscarConStock(q, sucursalId);
}
```

- [ ] **Step 5: Test endpoint**

```bash
curl -s "http://localhost:8080/api/producto/buscar?q=agua&sucursalId=1" \
  -H "Authorization: Bearer <token>"
```
Expected: JSON array with `id, inventarioId, nombre, sku, precio, stockActual`.

- [ ] **Step 6: Commit**
```bash
git add hormigas/src/main/java/com/example/hormigas/producto/
git commit -m "feat(backend): add product search with stock endpoint GET /api/producto/buscar"
```

---

## Task 3: Backend — Venta batch endpoint

**Files:**
- Create: `hormigas/src/main/java/com/example/hormigas/movimiento/dto/VentaBatchItemDTO.java`
- Create: `hormigas/src/main/java/com/example/hormigas/movimiento/dto/VentaBatchDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/movimiento/service/MovimientoService.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/movimiento/controller/MovimientoController.java`

- [ ] **Step 1: Create `VentaBatchItemDTO.java`**

```java
package com.example.hormigas.movimiento.dto;

public record VentaBatchItemDTO(
        Long productoId,
        int cantidad
) {}
```

- [ ] **Step 2: Create `VentaBatchDTO.java`**

```java
package com.example.hormigas.movimiento.dto;

import java.util.List;

public record VentaBatchDTO(
        List<VentaBatchItemDTO> items,
        String referencia
) {}
```

- [ ] **Step 3: Add `registrarVentaBatch` to `MovimientoService.java`**

The method extracts `sucursalId` from the logged-in user's JWT claim. Inject `TokenService` and extract claim, or inject `UsuarioService` and get the user then their sucursal. Since `Usuario` now has `sucursal`, use `usuarioService.getUsuarioLogueado().getSucursal().getId()`.

Add this method (inside the existing `MovimientoService` class, after `registrarMovimiento`):

```java
import java.util.ArrayList;

@Transactional
public List<MovimientoResponseDTO> registrarVentaBatch(VentaBatchDTO dto) {
    Usuario user = usuarioService.getUsuarioLogueado();
    Long sucursalId = user.getSucursal().getId();

    List<MovimientoResponseDTO> resultados = new ArrayList<>();

    for (VentaBatchItemDTO item : dto.items()) {
        Inventario inventario = inventarioRepository
            .findBySucursalIdAndProductoId(sucursalId, item.productoId())
            .orElseThrow(() -> new EntityNotFoundException(
                "Inventario no encontrado para productoId=" + item.productoId()
            ));

        int stockActual = inventario.getStockActual();
        int nuevoStock = TipoMovimiento.VENTA.aplicar(stockActual, item.cantidad());

        if (nuevoStock < 0) throw new IllegalArgumentException(
            "Stock insuficiente para productoId=" + item.productoId()
        );

        inventario.setStockActual(nuevoStock);
        inventarioRepository.save(inventario);

        Movimiento movimiento = new Movimiento();
        movimiento.setTipoMovimiento(TipoMovimiento.VENTA);
        movimiento.setCantidad(item.cantidad());
        movimiento.setStockAnterior(stockActual);
        movimiento.setStockNuevo(nuevoStock);
        movimiento.setUsuario(user);
        movimiento.setInventario(inventario);
        movimiento.setReferencia(dto.referencia());
        movimiento.setFecha(LocalDateTime.now());
        movimientoRepository.save(movimiento);

        resultados.add(MovimientoMapper.toResponse(movimiento));
    }

    return resultados;
}
```

- [ ] **Step 4: Add endpoint to `MovimientoController.java`**

```java
import com.example.hormigas.movimiento.dto.VentaBatchDTO;
import java.util.List;

@PostMapping("/venta/batch")
public List<MovimientoResponseDTO> registrarVentaBatch(@RequestBody VentaBatchDTO dto) {
    return movimientoService.registrarVentaBatch(dto);
}
```

- [ ] **Step 5: Test batch endpoint**

```bash
curl -s -X POST http://localhost:8080/api/movimiento/venta/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productoId":1,"cantidad":1}],"referencia":"TEST-001"}'
```
Expected: `200 OK` with array of MovimientoResponseDTO. Stock decremented.

- [ ] **Step 6: Check `MovimientoMapper.toResponse` includes `inventario`**

Open `MovimientoMapper.java`. Ensure it reads `movimiento.getInventario()` for `productoId`/`sucursalId`. If `inventario` is null, those fields will be null — acceptable for now.

- [ ] **Step 7: Commit**
```bash
git add hormigas/src/main/java/com/example/hormigas/movimiento/
git commit -m "feat(backend): add POST /api/movimiento/venta/batch transactional batch sale endpoint"
```

---

## Task 4: Shared packages — Sale entity + DB schema

**Files:**
- Create: `packages/domain/entities/sale/Sale.ts`
- Modify: `packages/domain/entities/index.ts`
- Modify: `packages/domain/database/Schema.ts`

- [ ] **Step 1: Create `Sale.ts`**

```typescript
// packages/domain/entities/sale/Sale.ts

export interface SaleItem {
    productoLocalId: string
    productoServerId: number | null
    nombre: string
    sku: string
    precio: number
    cantidad: number
    subtotal: number
}

export interface Sale {
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

- [ ] **Step 2: Re-export from `packages/domain/entities/index.ts`**

Add at the end of the file:
```typescript
export * from './sale/Sale'
```

- [ ] **Step 3: Add `venta` + `venta_item` tables to `Schema.ts`**

Append at the end of the `CREATE_TABLES_SQL` string (before the closing backtick):
```sql
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

- [ ] **Step 4: Commit**
```bash
git add packages/domain/
git commit -m "feat(packages): add Sale domain entity and venta tables to DB schema"
```

---

## Task 5: Shared packages — Sale DTOs + repository interfaces + SaleService

**Files:**
- Create: `packages/application/use-cases/sale/sale.dto.ts`
- Create: `packages/application/repositories/sale.repository.ts`
- Create: `packages/application/port/sale-api.port.ts`
- Create: `packages/application/services/sale.service.ts`
- Create: `packages/application/factories/createSaleService.ts`
- Modify: `packages/application/index.ts`

- [ ] **Step 1: Create `sale.dto.ts`**

```typescript
// packages/application/use-cases/sale/sale.dto.ts

export interface ProductWithStock {
    productoLocalId: string
    productoServerId: number | null
    inventarioServerId: number | null
    nombre: string
    sku: string
    precio: number
    stockActual: number
}

export interface CartItem {
    productoLocalId: string
    productoServerId: number | null
    nombre: string
    sku: string
    precio: number
    cantidad: number
    subtotal: number
}

export interface RegisterSaleDTO {
    items: CartItem[]
    sucursalServerId: number
    montoRecibido: number
}
```

- [ ] **Step 2: Create `sale.repository.ts`**

```typescript
// packages/application/repositories/sale.repository.ts

import { Sale } from '@hormigas/domain'

export interface ISaleRepository {
    save(sale: Sale): Promise<void>
    findAll(): Promise<Sale[]>
    findByDate(fecha: string): Promise<Sale[]>
}
```

- [ ] **Step 3: Create `sale-api.port.ts`**

```typescript
// packages/application/port/sale-api.port.ts

export interface VentaBatchRequest {
    items: { productoId: number; cantidad: number }[]
    referencia: string
}

export interface ProductoConStockResponse {
    id: number
    inventarioId: number | null
    nombre: string
    sku: string
    precio: number
    stockActual: number
}

export interface IApiSaleRepository {
    registrarVentaBatch(request: VentaBatchRequest): Promise<void>
    buscarProductosConStock(q: string, sucursalId: number): Promise<ProductoConStockResponse[]>
}
```

- [ ] **Step 4: Create `sale.service.ts`**

```typescript
// packages/application/services/sale.service.ts

import { Sale, SaleItem } from '@hormigas/domain'
import { ISaleRepository } from '../repositories/sale.repository'
import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { IApiSaleRepository } from '../port/sale-api.port'
import { CartItem, ProductWithStock, RegisterSaleDTO } from '../use-cases/sale/sale.dto'
import { generateUUID } from '../utils/uuid'

export interface ILocalInventaryRepository {
    decrementStock(productoLocalId: string, sucursalServerId: number, cantidad: number): Promise<void>
    searchWithStock(q: string, sucursalServerId: number): Promise<{
        productoLocalId: string
        productoServerId: number | null
        nombre: string
        sku: string
        precio: number
        stockActual: number
    }[]>
    upsertFromServer(inventarioId: number, productoServerId: number, sucursalServerId: number, stockActual: number): Promise<void>
}

export class SaleService {
    constructor(
        private saleRepo: ISaleRepository,
        private inventaryRepo: ILocalInventaryRepository,
        private syncQueueRepo: ISyncQueueRepository,
        private apiSaleRepo: IApiSaleRepository
    ) {}

    async registerSale(dto: RegisterSaleDTO): Promise<Sale> {
        const saleItems: SaleItem[] = dto.items.map(item => ({
            productoLocalId: item.productoLocalId,
            productoServerId: item.productoServerId,
            nombre: item.nombre,
            sku: item.sku,
            precio: item.precio,
            cantidad: item.cantidad,
            subtotal: item.precio * item.cantidad,
        }))

        const total = saleItems.reduce((sum, i) => sum + i.subtotal, 0)
        const cambio = Math.max(0, dto.montoRecibido - total)

        const sale: Sale = {
            localId: generateUUID(),
            sucursalId: String(dto.sucursalServerId),
            items: saleItems,
            total,
            montoRecibido: dto.montoRecibido,
            cambio,
            fecha: new Date().toISOString(),
            sincronizado: false,
        }

        for (const item of saleItems) {
            await this.inventaryRepo.decrementStock(item.productoLocalId, dto.sucursalServerId, item.cantidad)
        }

        await this.saleRepo.save(sale)

        const queueItem: SyncQueueItem = {
            id: generateUUID(),
            entity: 'venta',
            entityId: sale.localId,
            operation: 'CREATE',
            payload: JSON.stringify({
                items: saleItems
                    .filter(i => i.productoServerId != null)
                    .map(i => ({ productoId: i.productoServerId, cantidad: i.cantidad })),
                referencia: sale.localId,
            }),
            status: 'PENDING',
            retries: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        await this.syncQueueRepo.save(queueItem)

        return sale
    }

    async syncPending(): Promise<void> {
        const pending = await this.syncQueueRepo.findPending(20)
        for (const item of pending) {
            if (item.entity !== 'venta') continue
            try {
                const payload = JSON.parse(item.payload)
                await this.apiSaleRepo.registrarVentaBatch(payload)
                await this.syncQueueRepo.markAsProcessed(item.id)
            } catch (e) {
                await this.syncQueueRepo.incrementRetries(item.id)
                console.warn(`[SaleService] sync falló para ${item.entityId}:`, e)
            }
        }
    }

    async searchProducts(q: string, sucursalServerId: number): Promise<ProductWithStock[]> {
        const rows = await this.inventaryRepo.searchWithStock(q, sucursalServerId)
        return rows.map(r => ({
            productoLocalId: r.productoLocalId,
            productoServerId: r.productoServerId,
            inventarioServerId: null,
            nombre: r.nombre,
            sku: r.sku,
            precio: r.precio,
            stockActual: r.stockActual,
        }))
    }

    async pullProductsWithStock(sucursalServerId: number): Promise<void> {
        const serverItems = await this.apiSaleRepo.buscarProductosConStock('', sucursalServerId)
        for (const sp of serverItems) {
            if (sp.inventarioId == null) continue
            await this.inventaryRepo.upsertFromServer(
                sp.inventarioId, sp.id, sucursalServerId, sp.stockActual
            )
        }
    }

    async getHistory(): Promise<Sale[]> {
        return this.saleRepo.findAll()
    }
}
```

- [ ] **Step 5: Create `createSaleService.ts`**

```typescript
// packages/application/factories/createSaleService.ts

import { SaleService, ILocalInventaryRepository } from '../services/sale.service'
import { ISaleRepository } from '../repositories/sale.repository'
import { ISyncQueueRepository } from '../sync/sync.interfaces'
import { IApiSaleRepository } from '../port/sale-api.port'

export function createSaleService(
    saleRepo: ISaleRepository,
    inventaryRepo: ILocalInventaryRepository,
    syncQueueRepo: ISyncQueueRepository,
    apiSaleRepo: IApiSaleRepository
): SaleService {
    return new SaleService(saleRepo, inventaryRepo, syncQueueRepo, apiSaleRepo)
}
```

- [ ] **Step 6: Update `packages/application/index.ts`**

Add these exports at the end:
```typescript
// Sale
export * from './use-cases/sale/sale.dto'
export * from './repositories/sale.repository'
export * from './port/sale-api.port'
export * from './services/sale.service'
export * from './factories/createSaleService'
```

- [ ] **Step 7: Commit**
```bash
git add packages/application/
git commit -m "feat(packages): add SaleService, ISaleRepository, IApiSaleRepository, CartItem/ProductWithStock types"
```

---

## Task 6: Shared packages — Infrastructure implementations

**Files:**
- Create: `packages/infrastructure/src/sale/SqliteSaleRepositoryImpl.ts`
- Create: `packages/infrastructure/src/sale/SqliteInventaryForSaleImpl.ts`
- Create: `packages/infrastructure/src/sale/ApiSaleRepositoryImpl.ts`
- Modify: `packages/infrastructure/index.ts`

- [ ] **Step 1: Create `SqliteSaleRepositoryImpl.ts`**

```typescript
// packages/infrastructure/src/sale/SqliteSaleRepositoryImpl.ts

import { Sale } from '@hormigas/domain'
import { ISaleRepository } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'
import { generateUUID } from '@hormigas/application'

type VentaRow = {
    id: string
    sucursal_id: string
    total: number
    monto_recibido: number
    cambio: number
    fecha: string
    sincronizado: number
}

type VentaItemRow = {
    id: string
    venta_id: string
    producto_local_id: string
    producto_server_id: number | null
    nombre: string
    sku: string
    precio: number
    cantidad: number
    subtotal: number
}

export class SqliteSaleRepositoryImpl implements ISaleRepository {
    constructor(private db: DatabaseClient) {}

    async save(sale: Sale): Promise<void> {
        await this.db.run(
            `INSERT OR REPLACE INTO venta (id, sucursal_id, total, monto_recibido, cambio, fecha, sincronizado)
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [sale.localId, sale.sucursalId, sale.total, sale.montoRecibido, sale.cambio, sale.fecha]
        )
        for (const item of sale.items) {
            await this.db.run(
                `INSERT OR REPLACE INTO venta_item
                 (id, venta_id, producto_local_id, producto_server_id, nombre, sku, precio, cantidad, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    generateUUID(), sale.localId,
                    item.productoLocalId, item.productoServerId ?? null,
                    item.nombre, item.sku, item.precio, item.cantidad, item.subtotal,
                ]
            )
        }
    }

    async findAll(): Promise<Sale[]> {
        const ventas = await this.db.getMany<VentaRow>(
            'SELECT * FROM venta ORDER BY fecha DESC LIMIT 100'
        )
        const result: Sale[] = []
        for (const v of ventas) {
            const items = await this.db.getMany<VentaItemRow>(
                'SELECT * FROM venta_item WHERE venta_id = ?',
                [v.id]
            )
            result.push({
                localId: v.id,
                sucursalId: v.sucursal_id,
                items: items.map(i => ({
                    productoLocalId: i.producto_local_id,
                    productoServerId: i.producto_server_id,
                    nombre: i.nombre,
                    sku: i.sku,
                    precio: i.precio,
                    cantidad: i.cantidad,
                    subtotal: i.subtotal,
                })),
                total: v.total,
                montoRecibido: v.monto_recibido,
                cambio: v.cambio,
                fecha: v.fecha,
                sincronizado: v.sincronizado === 1,
            })
        }
        return result
    }

    async findByDate(fecha: string): Promise<Sale[]> {
        const ventas = await this.db.getMany<VentaRow>(
            "SELECT * FROM venta WHERE fecha LIKE ? ORDER BY fecha DESC",
            [`${fecha}%`]
        )
        const result: Sale[] = []
        for (const v of ventas) {
            const items = await this.db.getMany<VentaItemRow>(
                'SELECT * FROM venta_item WHERE venta_id = ?', [v.id]
            )
            result.push({
                localId: v.id,
                sucursalId: v.sucursal_id,
                items: items.map(i => ({
                    productoLocalId: i.producto_local_id,
                    productoServerId: i.producto_server_id,
                    nombre: i.nombre, sku: i.sku, precio: i.precio,
                    cantidad: i.cantidad, subtotal: i.subtotal,
                })),
                total: v.total, montoRecibido: v.monto_recibido, cambio: v.cambio,
                fecha: v.fecha, sincronizado: v.sincronizado === 1,
            })
        }
        return result
    }
}
```

- [ ] **Step 2: Create `SqliteInventaryForSaleImpl.ts`**

```typescript
// packages/infrastructure/src/sale/SqliteInventaryForSaleImpl.ts

import { ILocalInventaryRepository } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'

export class SqliteInventaryForSaleImpl implements ILocalInventaryRepository {
    constructor(private db: DatabaseClient) {}

    async decrementStock(
        productoLocalId: string,
        sucursalServerId: number,
        cantidad: number
    ): Promise<void> {
        await this.db.run(
            `UPDATE inventario
             SET stock_actual = MAX(0, stock_actual - ?),
                 ultima_actualizacion = ?
             WHERE sucursal_id = ?
               AND producto_id = (SELECT server_id FROM producto WHERE local_id = ?)`,
            [cantidad, new Date().toISOString(), sucursalServerId, productoLocalId]
        )
    }

    async searchWithStock(q: string, sucursalServerId: number): Promise<{
        productoLocalId: string
        productoServerId: number | null
        nombre: string
        sku: string
        precio: number
        stockActual: number
    }[]> {
        const pattern = `%${q}%`
        return this.db.getMany(
            `SELECT p.local_id as productoLocalId,
                    p.server_id as productoServerId,
                    p.nombre,
                    p.sku,
                    p.precio,
                    COALESCE(i.stock_actual, 0) as stockActual
             FROM producto p
             LEFT JOIN inventario i
               ON i.producto_id = p.server_id
               AND i.sucursal_id = ?
             WHERE p.activo = 1
               AND (LOWER(p.nombre) LIKE LOWER(?) OR LOWER(p.sku) LIKE LOWER(?))
             ORDER BY p.nombre ASC
             LIMIT 30`,
            [sucursalServerId, pattern, pattern]
        )
    }

    async upsertFromServer(
        inventarioId: number,
        productoServerId: number,
        sucursalServerId: number,
        stockActual: number
    ): Promise<void> {
        await this.db.run(
            `INSERT OR REPLACE INTO inventario
             (id, producto_id, sucursal_id, stock_actual, stock_maximo, ultima_actualizacion)
             VALUES (?, ?, ?, ?, 9999, ?)`,
            [inventarioId, productoServerId, sucursalServerId, stockActual, new Date().toISOString()]
        )
    }
}
```

- [ ] **Step 3: Create `ApiSaleRepositoryImpl.ts`**

```typescript
// packages/infrastructure/src/sale/ApiSaleRepositoryImpl.ts

import { IApiSaleRepository, VentaBatchRequest, ProductoConStockResponse } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiSaleRepositoryImpl implements IApiSaleRepository {
    constructor(private http: ApiHttpClient) {}

    async registrarVentaBatch(request: VentaBatchRequest): Promise<void> {
        await this.http.post('/api/movimiento/venta/batch', request)
    }

    async buscarProductosConStock(q: string, sucursalId: number): Promise<ProductoConStockResponse[]> {
        return this.http.get(`/api/producto/buscar?q=${encodeURIComponent(q)}&sucursalId=${sucursalId}`)
    }
}
```

- [ ] **Step 4: Check `ApiHttpClient` has `get` and `post` methods**

Open `packages/infrastructure/src/http/ApiHttpClient.ts`. Confirm it has `get<T>(path): Promise<T>` and `post<T>(path, body): Promise<T>`. If not, add them following the existing pattern.

- [ ] **Step 5: Update `packages/infrastructure/index.ts`**

Add at the end:
```typescript
// Sale infrastructure
export * from './src/sale/SqliteSaleRepositoryImpl'
export * from './src/sale/SqliteInventaryForSaleImpl'
export * from './src/sale/ApiSaleRepositoryImpl'
```

- [ ] **Step 6: Commit**
```bash
git add packages/infrastructure/
git commit -m "feat(packages): add SqliteSaleRepository, SqliteInventaryForSale, ApiSaleRepository"
```

---

## Task 7: POS App — Project setup

**Files:**
- Modify: `apps/mobile/hormigas_POS/package.json`
- Modify: `apps/mobile/hormigas_POS/tsconfig.json`
- Create: `apps/mobile/hormigas_POS/metro.config.js`
- Create: `apps/mobile/hormigas_POS/babel.config.js`
- Create: `apps/mobile/hormigas_POS/db/DataBase.ts`
- Create: `apps/mobile/hormigas_POS/src/adapters/ExpoSQLiteClient.ts`
- Create: `apps/mobile/hormigas_POS/src/adapters/AsyncStorageAdapter.ts`
- Create: `apps/mobile/hormigas_POS/src/utils/hooks/useInitDatabase.ts`

- [ ] **Step 1: Update `package.json`** — add workspace deps + missing native deps

Replace `dependencies` section:
```json
"dependencies": {
  "@expo/vector-icons": "^15.0.3",
  "@hormigas/application": "workspace:*",
  "@hormigas/domain": "workspace:*",
  "@hormigas/infrastructure": "workspace:*",
  "@hormigas/mobile-shared": "workspace:*",
  "@react-native-community/netinfo": "^11.4.1",
  "@react-navigation/bottom-tabs": "^7.4.0",
  "@react-navigation/elements": "^2.6.3",
  "@react-navigation/native": "^7.1.8",
  "expo": "~54.0.33",
  "expo-constants": "~18.0.13",
  "expo-font": "~14.0.11",
  "expo-haptics": "~15.0.8",
  "expo-linking": "~8.0.11",
  "expo-router": "~6.0.23",
  "expo-secure-store": "~15.0.8",
  "expo-splash-screen": "~31.0.13",
  "expo-sqlite": "^16.0.10",
  "expo-status-bar": "~3.0.9",
  "expo-system-ui": "~6.0.9",
  "expo-web-browser": "~15.0.10",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.5",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-web": "~0.21.0",
  "react-native-worklets": "0.5.1"
}
```

Add `"expo": { "metroConfig": "metro.config.js" }` field at root level of package.json (same level as `name`):
```json
"expo": {
  "metroConfig": "metro.config.js"
},
```

Add to `devDependencies`:
```json
"babel-preset-expo": "~54.0.10",
"babel-plugin-module-resolver": "^5.0.3"
```

- [ ] **Step 2: Update `tsconfig.json`**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@hormigas/domain": ["../../packages/domain/index.ts"],
      "@hormigas/infrastructure": ["../../packages/infrastructure/index.ts"],
      "@hormigas/application": ["../../packages/application/index.ts"],
      "@hormigas/mobile-shared": ["../shared/index.ts"]
    },
    "jsx": "react-native",
    "moduleResolution": "bundler",
    "typeRoots": ["./node_modules/@types", "../../node_modules/@types"],
    "moduleSuffixes": [".ios", ".android", ".native", ""]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "../shared/context/NetworkContext.tsx",
    "../shared/hooks/useUserServiceFactory.tsx"
  ]
}
```

Check if `apps/mobile/` has a `tsconfig.base.json`. If it doesn't exist, replace `"extends": "../../../tsconfig.base.json"` with `"extends": "expo/tsconfig.base"`.

- [ ] **Step 3: Create `metro.config.js`**

```javascript
// apps/mobile/hormigas_POS/metro.config.js
const { getDefaultConfig } = require("expo/metro-config")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../../..")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]

config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  '@hormigas/application': path.resolve(workspaceRoot, 'packages/application'),
  '@hormigas/domain': path.resolve(workspaceRoot, 'packages/domain'),
  '@hormigas/mobile-shared': path.resolve(workspaceRoot, 'apps/mobile/shared'),
  '@hormigas/infrastructure': path.resolve(workspaceRoot, 'packages/infrastructure'),
}

config.resolver.blockList = [
  new RegExp(
    `${path.resolve(workspaceRoot, 'apps', 'mobile', 'hormigas_mobile', 'node_modules').replace(/\\/g, '\\\\')}.*`
  ),
]

module.exports = config
```

- [ ] **Step 4: Create `babel.config.js`**

```javascript
// apps/mobile/hormigas_POS/babel.config.js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        alias: {
          '@hormigas/application': '../../../packages/application',
          '@hormigas/domain': '../../../packages/domain',
          '@hormigas/infrastructure': '../../../packages/infrastructure',
          '@hormigas/mobile-shared': '../shared',
        },
      }],
      'react-native-reanimated/plugin',
    ],
  }
}
```

- [ ] **Step 5: Run `pnpm install` from repo root**

```bash
cd /home/uhernand/interfaz_hormigas && pnpm install
```
Expected: dependencies resolved for `hormigas_pos` workspace.

- [ ] **Step 6: Create `db/DataBase.ts`**

```typescript
// apps/mobile/hormigas_POS/db/DataBase.ts
import * as SQLite from 'expo-sqlite'
import { CREATE_TABLES_SQL } from '@hormigas/domain'

let db: SQLite.SQLiteDatabase | null = null

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('hormigas_pos.db')
    }
    return db
}

export const initDatabase = async () => {
    const database = await getDB()
    await database.execAsync(CREATE_TABLES_SQL)
}
```

Note: uses `hormigas_pos.db` (different filename than `hormigas_mobile`) to avoid DB conflicts if installed on same device.

- [ ] **Step 7: Create `src/adapters/ExpoSQLiteClient.ts`**

```typescript
// apps/mobile/hormigas_POS/src/adapters/ExpoSQLiteClient.ts
import * as SQLite from 'expo-sqlite'
import { DatabaseClient } from '@hormigas/infrastructure'

type BindParams = (string | number | null | ArrayBuffer)[]

export class ExpoSQLiteClient implements DatabaseClient {
    constructor(private db: SQLite.SQLiteDatabase) {}

    async run(query: string, params?: unknown[]): Promise<void> {
        await this.db.runAsync(query, (params ?? []) as BindParams)
    }

    async getOne<T>(query: string, params?: unknown[]): Promise<T | null> {
        return this.db.getFirstAsync<T>(query, (params ?? []) as BindParams)
    }

    async getMany<T>(query: string, params?: unknown[]): Promise<T[]> {
        return this.db.getAllAsync<T>(query, (params ?? []) as BindParams)
    }
}
```

- [ ] **Step 8: Create `src/adapters/AsyncStorageAdapter.ts`**

```typescript
// apps/mobile/hormigas_POS/src/adapters/AsyncStorageAdapter.ts
import * as SecureStorage from 'expo-secure-store'
import { IStorage } from '@hormigas/application'

class StorageAdapter implements IStorage {
    async setItem(key: string, value: string): Promise<void> {
        await SecureStorage.setItemAsync(key, value)
    }
    async getItem(key: string): Promise<string | null> {
        return SecureStorage.getItemAsync(key)
    }
    async removeItem(key: string): Promise<void> {
        await SecureStorage.deleteItemAsync(key)
    }
}

export const storage: IStorage = new StorageAdapter()
```

- [ ] **Step 9: Create `src/utils/hooks/useInitDatabase.ts`**

```typescript
// apps/mobile/hormigas_POS/src/utils/hooks/useInitDatabase.ts
import { useEffect, useState } from 'react'
import { initDatabase } from '@/db/DataBase'

export function useInitDatabase() {
    const [isReady, setIsReady] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        initDatabase()
            .then(() => setIsReady(true))
            .catch((e: Error) => setError(e))
    }, [])

    return { isReady, error }
}
```

- [ ] **Step 10: Commit**
```bash
git add apps/mobile/hormigas_POS/
git commit -m "feat(pos): project setup - metro, babel, tsconfig, DB init, adapters"
```

---

## Task 8: POS App — Auth + login screen

**Files:**
- Create: `apps/mobile/hormigas_POS/src/adapters/syncQueueInstance.ts`
- Create: `apps/mobile/hormigas_POS/src/login/hooks/useAuth.ts`
- Create: `apps/mobile/hormigas_POS/app/(login)/_layout.tsx`
- Create: `apps/mobile/hormigas_POS/app/(login)/index.tsx`

- [ ] **Step 1: Create `syncQueueInstance.ts`**

```typescript
// apps/mobile/hormigas_POS/src/adapters/syncQueueInstance.ts
import { SqliteSyncQueueRepositoryImpl } from '@hormigas/infrastructure'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'

let _repo: SqliteSyncQueueRepositoryImpl | null = null
let _initPromise: Promise<SqliteSyncQueueRepositoryImpl> | null = null

export const getSyncQueueRepo = (): Promise<SqliteSyncQueueRepositoryImpl> => {
    if (_repo) return Promise.resolve(_repo)
    if (_initPromise) return _initPromise
    _initPromise = (async () => {
        const db = await getDB()
        const dbClient = new ExpoSQLiteClient(db)
        _repo = new SqliteSyncQueueRepositoryImpl(dbClient)
        return _repo
    })()
    return _initPromise
}
```

- [ ] **Step 2: Create `useAuth.ts`**

```typescript
// apps/mobile/hormigas_POS/src/login/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { storage } from '@/src/adapters/AsyncStorageAdapter'
import { TokenServiceImpl, UserServiceHTTP, ApiHttpClient } from '@hormigas/infrastructure'
import { UserRequestDTO } from '@hormigas/application'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''
const tokenService = new TokenServiceImpl(storage)
const httpClient = new ApiHttpClient(API_URL, tokenService)
const userServiceHTTP = new UserServiceHTTP(tokenService, httpClient)

function decodeJWT(token: string): Record<string, unknown> {
    const segment = token.split('.')[1]
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf-8')
    return JSON.parse(json)
}

export interface AuthState {
    token: string | null
    sucursalServerId: number | null
    isLoading: boolean
}

export function useAuth() {
    const [token, setToken] = useState<string | null>(null)
    const [sucursalServerId, setSucursalServerId] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadToken = async () => {
        const saved = await tokenService.getToken()
        setToken(saved)
        if (saved) {
            try {
                const payload = decodeJWT(saved)
                setSucursalServerId(payload.sucursalId as number ?? null)
            } catch {
                setSucursalServerId(null)
            }
        }
    }

    useEffect(() => {
        loadToken().finally(() => setIsLoading(false))
    }, [])

    const login = async (dto: UserRequestDTO) => {
        await userServiceHTTP.login(dto)
        await loadToken()
    }

    const logout = async () => {
        await tokenService.clearTokens()
        setToken(null)
        setSucursalServerId(null)
    }

    return { token, sucursalServerId, isLoading, login, logout }
}
```

- [ ] **Step 3: Create `app/(login)/_layout.tsx`**

```typescript
// apps/mobile/hormigas_POS/app/(login)/_layout.tsx
import { Stack } from 'expo-router'

export default function LoginLayout() {
    return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 4: Create `app/(login)/index.tsx`** — login screen

```typescript
// apps/mobile/hormigas_POS/app/(login)/index.tsx
import { useState } from 'react'
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/src/login/hooks/useAuth'

export default function LoginScreen() {
    const { login } = useAuth()
    const [correo, setCorreo] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        if (!correo || !password) return
        setLoading(true)
        try {
            await login({ correo, password })
            router.replace('/(tabs)/pos')
        } catch {
            Alert.alert('Error', 'Credenciales incorrectas')
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={styles.title}>Hormigas POS</Text>
            <TextInput
                style={styles.input}
                placeholder="Correo"
                value={correo}
                onChangeText={setCorreo}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>Iniciar sesión</Text>
                }
            </TouchableOpacity>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center', color: '#1e40af' },
    input: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
        padding: 12, marginBottom: 16, fontSize: 16,
    },
    btn: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
```

- [ ] **Step 5: Commit**
```bash
git add apps/mobile/hormigas_POS/src/login/ apps/mobile/hormigas_POS/app/\(login\)/ apps/mobile/hormigas_POS/src/adapters/syncQueueInstance.ts
git commit -m "feat(pos): add auth hook with JWT decode for sucursalId + login screen"
```

---

## Task 9: POS App — Sale service adapter

**Files:**
- Create: `apps/mobile/hormigas_POS/src/adapters/saleServiceInstance.ts`

- [ ] **Step 1: Create `saleServiceInstance.ts`**

```typescript
// apps/mobile/hormigas_POS/src/adapters/saleServiceInstance.ts
import {
    createSaleService, SaleService,
    TokenServiceImpl, ApiHttpClient,
    SqliteSaleRepositoryImpl, SqliteInventaryForSaleImpl,
    SqliteSyncQueueRepositoryImpl, ApiSaleRepositoryImpl
} from '@hormigas/infrastructure'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _service: SaleService | null = null
let _initPromise: Promise<SaleService> | null = null

export const getSaleService = (): Promise<SaleService> => {
    if (_service) return Promise.resolve(_service)
    if (_initPromise) return _initPromise

    _initPromise = (async () => {
        const db = await getDB()
        const dbClient = new ExpoSQLiteClient(db)
        const tokenService = new TokenServiceImpl(storage)
        const httpClient = new ApiHttpClient(API_URL, tokenService)

        const saleRepo = new SqliteSaleRepositoryImpl(dbClient)
        const inventaryRepo = new SqliteInventaryForSaleImpl(dbClient)
        const syncQueueRepo = new SqliteSyncQueueRepositoryImpl(dbClient)
        const apiSaleRepo = new ApiSaleRepositoryImpl(httpClient)

        _service = createSaleService(saleRepo, inventaryRepo, syncQueueRepo, apiSaleRepo)
        return _service
    })()

    return _initPromise
}
```

Note: `SqliteSaleRepositoryImpl`, `SqliteInventaryForSaleImpl`, `ApiSaleRepositoryImpl` must be exported from `@hormigas/infrastructure` (done in Task 6 Step 5). Also `createSaleService` from `@hormigas/application` must be re-exported through infrastructure or imported from `@hormigas/application` directly.

Fix import if `createSaleService` is in `@hormigas/application` not `@hormigas/infrastructure`:
```typescript
import { createSaleService, SaleService } from '@hormigas/application'
import {
    TokenServiceImpl, ApiHttpClient,
    SqliteSaleRepositoryImpl, SqliteInventaryForSaleImpl,
    SqliteSyncQueueRepositoryImpl, ApiSaleRepositoryImpl
} from '@hormigas/infrastructure'
```

- [ ] **Step 2: Commit**
```bash
git add apps/mobile/hormigas_POS/src/adapters/saleServiceInstance.ts
git commit -m "feat(pos): add SaleService singleton adapter"
```

---

## Task 10: POS App — usePOS hook + POSScreen

**Files:**
- Create: `apps/mobile/hormigas_POS/src/pos/hooks/usePOS.ts`
- Create: `apps/mobile/hormigas_POS/src/pos/screens/POSScreen.tsx`

- [ ] **Step 1: Create `usePOS.ts`**

```typescript
// apps/mobile/hormigas_POS/src/pos/hooks/usePOS.ts
import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { CartItem, ProductWithStock } from '@hormigas/application'
import { getSaleService } from '@/src/adapters/saleServiceInstance'
import { useAuth } from '@/src/login/hooks/useAuth'
import { useNetwork } from '../../../shared/context/NetworkContext'

export function usePOS() {
    const { sucursalServerId } = useAuth()
    const { isOnline } = useNetwork()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ProductWithStock[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [montoRecibido, setMontoRecibido] = useState('')
    const [isSyncing, setIsSyncing] = useState(false)
    const [lastSale, setLastSale] = useState<{ total: number; cambio: number } | null>(null)

    const total = cart.reduce((sum, i) => sum + i.subtotal, 0)
    const montoNum = parseFloat(montoRecibido) || 0
    const cambio = Math.max(0, montoNum - total)
    const canCobrar = cart.length > 0 && montoNum >= total

    const search = useCallback(async (q: string) => {
        if (!sucursalServerId) return
        try {
            const svc = await getSaleService()
            const items = await svc.searchProducts(q, sucursalServerId)
            setResults(items)
        } catch (e) {
            console.warn('[usePOS] search error:', e)
        }
    }, [sucursalServerId])

    useEffect(() => {
        const timer = setTimeout(() => search(query), 300)
        return () => clearTimeout(timer)
    }, [query, search])

    // Pull products from server on mount when online
    useEffect(() => {
        if (!isOnline || !sucursalServerId) return
        getSaleService().then(svc => svc.pullProductsWithStock(sucursalServerId)).catch(() => {})
    }, [isOnline, sucursalServerId])

    // Sync pending sales when online
    useEffect(() => {
        if (!isOnline) return
        setIsSyncing(true)
        getSaleService()
            .then(svc => svc.syncPending())
            .catch(() => {})
            .finally(() => setIsSyncing(false))
    }, [isOnline])

    const addToCart = (product: ProductWithStock) => {
        setCart(prev => {
            const existing = prev.find(i => i.productoLocalId === product.productoLocalId)
            if (existing) {
                return prev.map(i =>
                    i.productoLocalId === product.productoLocalId
                        ? { ...i, cantidad: i.cantidad + 1, subtotal: i.precio * (i.cantidad + 1) }
                        : i
                )
            }
            return [...prev, {
                productoLocalId: product.productoLocalId,
                productoServerId: product.productoServerId,
                nombre: product.nombre,
                sku: product.sku,
                precio: product.precio,
                cantidad: 1,
                subtotal: product.precio,
            }]
        })
    }

    const updateQty = (productoLocalId: string, qty: number) => {
        if (qty <= 0) {
            setCart(prev => prev.filter(i => i.productoLocalId !== productoLocalId))
        } else {
            setCart(prev => prev.map(i =>
                i.productoLocalId === productoLocalId
                    ? { ...i, cantidad: qty, subtotal: i.precio * qty }
                    : i
            ))
        }
    }

    const cobrar = async () => {
        if (!sucursalServerId || !canCobrar) return
        try {
            const svc = await getSaleService()
            const sale = await svc.registerSale({
                items: cart,
                sucursalServerId,
                montoRecibido: montoNum,
            })
            setLastSale({ total: sale.total, cambio: sale.cambio })
            setCart([])
            setMontoRecibido('')
            setQuery('')
            setResults([])
            await search('')
        } catch (e) {
            Alert.alert('Error', 'No se pudo registrar la venta')
        }
    }

    const clearLastSale = () => setLastSale(null)

    return {
        query, setQuery,
        results,
        cart,
        montoRecibido, setMontoRecibido,
        total, cambio, canCobrar,
        addToCart, updateQty, cobrar,
        isSyncing, lastSale, clearLastSale,
    }
}
```

Note: the `useNetwork` import path from POS is `'../../../shared/context/NetworkContext'`. Verify relative path from `src/pos/hooks/` goes up 3 levels to `hormigas_POS/`, then needs to go to `../shared/context/NetworkContext`. 

From `apps/mobile/hormigas_POS/src/pos/hooks/`:
- `../` = `apps/mobile/hormigas_POS/src/pos/`
- `../../` = `apps/mobile/hormigas_POS/src/`
- `../../../` = `apps/mobile/hormigas_POS/`
- `../../../../` = `apps/mobile/`
- `../../../../shared/context/NetworkContext` ✓

Fix import:
```typescript
import { useNetwork } from '../../../../shared/context/NetworkContext'
```

- [ ] **Step 2: Create `POSScreen.tsx`**

```typescript
// apps/mobile/hormigas_POS/src/pos/screens/POSScreen.tsx
import { useEffect } from 'react'
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, ScrollView, Alert, Modal, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { usePOS } from '../hooks/usePOS'

export default function POSScreen() {
    const {
        query, setQuery, results, cart,
        montoRecibido, setMontoRecibido,
        total, cambio, canCobrar,
        addToCart, updateQty, cobrar,
        lastSale, clearLastSale,
    } = usePOS()

    return (
        <View style={styles.root}>
            {/* Search bar */}
            <View style={styles.searchRow}>
                <Ionicons name="search" size={18} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre o SKU..."
                    value={query}
                    onChangeText={setQuery}
                    clearButtonMode="while-editing"
                />
            </View>

            {/* Search results */}
            {results.length > 0 && (
                <View style={styles.resultsContainer}>
                    <FlatList
                        data={results}
                        keyExtractor={i => i.productoLocalId}
                        style={styles.resultsList}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.resultItem}
                                onPress={() => addToCart(item)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.resultNombre}>{item.nombre}</Text>
                                    <Text style={styles.resultSku}>{item.sku}</Text>
                                </View>
                                <View style={styles.resultRight}>
                                    <Text style={styles.resultPrecio}>${item.precio.toFixed(2)}</Text>
                                    <Text style={styles.resultStock}>stock: {item.stockActual}</Text>
                                </View>
                                <Ionicons name="add-circle" size={22} color="#2563eb" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Cart */}
            <View style={styles.cartContainer}>
                <Text style={styles.sectionTitle}>Carrito</Text>
                {cart.length === 0 && (
                    <Text style={styles.emptyCart}>Sin productos</Text>
                )}
                <ScrollView style={styles.cartList}>
                    {cart.map(item => (
                        <View key={item.productoLocalId} style={styles.cartItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cartNombre} numberOfLines={1}>{item.nombre}</Text>
                                <Text style={styles.cartSubtotal}>${item.subtotal.toFixed(2)}</Text>
                            </View>
                            <View style={styles.qtyRow}>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => updateQty(item.productoLocalId, item.cantidad - 1)}
                                >
                                    <Ionicons name="remove" size={16} color="#374151" />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{item.cantidad}</Text>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => updateQty(item.productoLocalId, item.cantidad + 1)}
                                >
                                    <Ionicons name="add" size={16} color="#374151" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Payment section */}
            <View style={styles.paymentSection}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                </View>
                <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Recibido:</Text>
                    <TextInput
                        style={styles.montoInput}
                        placeholder="$0.00"
                        value={montoRecibido}
                        onChangeText={setMontoRecibido}
                        keyboardType="decimal-pad"
                    />
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.cambioLabel}>Cambio:</Text>
                    <Text style={styles.cambioAmount}>${cambio.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.cobrarBtn, !canCobrar && styles.cobrarBtnDisabled]}
                    onPress={cobrar}
                    disabled={!canCobrar}
                >
                    <Ionicons name="cash" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.cobrarBtnText}>COBRAR</Text>
                </TouchableOpacity>
            </View>

            {/* Success modal */}
            <Modal visible={!!lastSale} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Ionicons name="checkmark-circle" size={64} color="#16a34a" />
                        <Text style={styles.modalTitle}>¡Venta registrada!</Text>
                        {lastSale && (
                            <>
                                <Text style={styles.modalLine}>Total: ${lastSale.total.toFixed(2)}</Text>
                                <Text style={styles.modalLine}>Cambio: ${lastSale.cambio.toFixed(2)}</Text>
                            </>
                        )}
                        <TouchableOpacity style={styles.modalBtn} onPress={clearLastSale}>
                            <Text style={styles.modalBtnText}>Nueva venta</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f9fafb' },
    searchRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', margin: 12, borderRadius: 10,
        paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb',
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 15 },
    resultsContainer: { maxHeight: 200, marginHorizontal: 12, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
    resultsList: { borderRadius: 10 },
    resultItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    resultNombre: { fontSize: 14, fontWeight: '500', color: '#111827' },
    resultSku: { fontSize: 12, color: '#6b7280' },
    resultRight: { alignItems: 'flex-end', marginRight: 4 },
    resultPrecio: { fontSize: 14, fontWeight: '600', color: '#111827' },
    resultStock: { fontSize: 11, color: '#6b7280' },
    cartContainer: { flex: 1, marginHorizontal: 12, marginTop: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    emptyCart: { color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 16 },
    cartList: { flex: 1 },
    cartItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 6,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    cartNombre: { fontSize: 14, fontWeight: '500', color: '#111827' },
    cartSubtotal: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
    qtyRow: { flexDirection: 'row', alignItems: 'center' },
    qtyBtn: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
    },
    qtyText: { marginHorizontal: 10, fontSize: 15, fontWeight: '600', minWidth: 20, textAlign: 'center' },
    paymentSection: {
        backgroundColor: '#fff', padding: 16,
        borderTopWidth: 1, borderTopColor: '#e5e7eb',
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalLabel: { fontSize: 16, fontWeight: '600', color: '#374151' },
    totalAmount: { fontSize: 20, fontWeight: '800', color: '#111827' },
    inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    inputLabel: { fontSize: 16, fontWeight: '600', color: '#374151', marginRight: 12 },
    montoInput: {
        flex: 1, borderWidth: 1, borderColor: '#d1d5db',
        borderRadius: 8, padding: 8, fontSize: 18, textAlign: 'right',
    },
    cambioLabel: { fontSize: 14, color: '#6b7280' },
    cambioAmount: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
    cobrarBtn: {
        backgroundColor: '#2563eb', borderRadius: 10, padding: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8,
    },
    cobrarBtnDisabled: { opacity: 0.4 },
    cobrarBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', width: '80%' },
    modalTitle: { fontSize: 22, fontWeight: '700', marginTop: 12, marginBottom: 8 },
    modalLine: { fontSize: 16, color: '#374151', marginBottom: 4 },
    modalBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
    modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
```

- [ ] **Step 3: Commit**
```bash
git add apps/mobile/hormigas_POS/src/pos/
git commit -m "feat(pos): add usePOS hook and POSScreen with cart, search, and payment"
```

---

## Task 11: POS App — History screen

**Files:**
- Create: `apps/mobile/hormigas_POS/src/history/screens/HistoryScreen.tsx`

- [ ] **Step 1: Create `HistoryScreen.tsx`**

```typescript
// apps/mobile/hormigas_POS/src/history/screens/HistoryScreen.tsx
import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native'
import { Sale } from '@hormigas/domain'
import { getSaleService } from '@/src/adapters/saleServiceInstance'
import { Ionicons } from '@expo/vector-icons'

export default function HistoryScreen() {
    const [sales, setSales] = useState<Sale[]>([])
    const [refreshing, setRefreshing] = useState(false)

    const load = useCallback(async () => {
        try {
            const svc = await getSaleService()
            const all = await svc.getHistory()
            setSales(all)
        } catch (e) {
            console.warn('[HistoryScreen]', e)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const totalHoy = sales
        .filter(s => s.fecha.startsWith(new Date().toISOString().slice(0, 10)))
        .reduce((sum, s) => sum + s.total, 0)

    return (
        <View style={styles.root}>
            <View style={styles.summaryCard}>
                <Ionicons name="today" size={24} color="#2563eb" />
                <Text style={styles.summaryLabel}>Ventas hoy</Text>
                <Text style={styles.summaryAmount}>${totalHoy.toFixed(2)}</Text>
            </View>
            <FlatList
                data={sales}
                keyExtractor={s => s.localId}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}
                renderItem={({ item }) => (
                    <View style={styles.saleCard}>
                        <View style={styles.saleHeader}>
                            <Text style={styles.saleDate}>
                                {new Date(item.fecha).toLocaleString('es-MX', { hour12: false })}
                            </Text>
                            <View style={[styles.syncBadge, item.sincronizado ? styles.syncDone : styles.syncPending]}>
                                <Ionicons
                                    name={item.sincronizado ? 'cloud-done' : 'cloud-upload'}
                                    size={12} color="#fff"
                                />
                            </View>
                        </View>
                        {item.items.map((si, idx) => (
                            <Text key={idx} style={styles.itemLine}>
                                {si.nombre} x{si.cantidad} — ${si.subtotal.toFixed(2)}
                            </Text>
                        ))}
                        <View style={styles.saleFooter}>
                            <Text style={styles.saleTotal}>Total: ${item.total.toFixed(2)}</Text>
                            <Text style={styles.saleCambio}>Cambio: ${item.cambio.toFixed(2)}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>Sin ventas registradas</Text>}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f9fafb' },
    summaryCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        margin: 12, padding: 16, borderRadius: 12, gap: 12,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    summaryLabel: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
    summaryAmount: { fontSize: 20, fontWeight: '800', color: '#111827' },
    list: { paddingHorizontal: 12, paddingBottom: 16 },
    saleCard: {
        backgroundColor: '#fff', borderRadius: 10, padding: 12,
        marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb',
    },
    saleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    saleDate: { fontSize: 12, color: '#6b7280' },
    syncBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    syncDone: { backgroundColor: '#16a34a' },
    syncPending: { backgroundColor: '#d97706' },
    itemLine: { fontSize: 13, color: '#374151', marginBottom: 2 },
    saleFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 6 },
    saleTotal: { fontSize: 14, fontWeight: '700', color: '#111827' },
    saleCambio: { fontSize: 13, color: '#6b7280' },
    empty: { textAlign: 'center', marginTop: 40, color: '#9ca3af', fontSize: 15 },
})
```

- [ ] **Step 2: Commit**
```bash
git add apps/mobile/hormigas_POS/src/history/
git commit -m "feat(pos): add HistoryScreen with today's sales summary and sync status"
```

---

## Task 12: POS App — Sync badge + Header + layouts + wiring

**Files:**
- Create: `apps/mobile/hormigas_POS/src/utils/hooks/useSyncQueueStatus.ts`
- Create: `apps/mobile/hormigas_POS/src/utils/components/SyncQueueBadge.tsx`
- Create: `apps/mobile/hormigas_POS/src/utils/components/POSHeader.tsx`
- Modify: `apps/mobile/hormigas_POS/app/_layout.tsx`
- Modify: `apps/mobile/hormigas_POS/app/(tabs)/_layout.tsx`
- Create: `apps/mobile/hormigas_POS/app/(tabs)/pos.tsx`
- Create: `apps/mobile/hormigas_POS/app/(tabs)/history.tsx`

- [ ] **Step 1: Create `useSyncQueueStatus.ts`**

```typescript
// apps/mobile/hormigas_POS/src/utils/hooks/useSyncQueueStatus.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { getSyncQueueRepo } from '@/src/adapters/syncQueueInstance'

export type SyncStatus = 'syncing' | 'pending' | 'done'

export function useSyncQueueStatus(pollMs = 3000) {
    const [pendingCount, setPendingCount] = useState(0)
    const [status, setStatus] = useState<SyncStatus>('done')

    const fetchCount = useCallback(async () => {
        try {
            const repo = await getSyncQueueRepo()
            const pending = await repo.findPending(100)
            const count = pending.filter(i => i.entity === 'venta').length
            setPendingCount(count)
            setStatus(count === 0 ? 'done' : 'pending')
        } catch {}
    }, [])

    useEffect(() => {
        fetchCount()
        const id = setInterval(fetchCount, pollMs)
        return () => clearInterval(id)
    }, [fetchCount, pollMs])

    return { pendingCount, status }
}
```

- [ ] **Step 2: Create `SyncQueueBadge.tsx`**

```typescript
// apps/mobile/hormigas_POS/src/utils/components/SyncQueueBadge.tsx
import { useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSyncQueueStatus } from '../hooks/useSyncQueueStatus'

function SpinningSync() {
    const rotation = useRef(new Animated.Value(0)).current
    useEffect(() => {
        const anim = Animated.loop(
            Animated.timing(rotation, { toValue: 1, duration: 1000, useNativeDriver: true })
        )
        anim.start()
        return () => anim.stop()
    }, [rotation])
    const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
    return (
        <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="sync" size={18} color="#2563eb" />
        </Animated.View>
    )
}

export default function SyncQueueBadge() {
    const { pendingCount, status } = useSyncQueueStatus()
    if (status === 'done') {
        return <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
    }
    return (
        <View style={styles.row}>
            {status === 'syncing' ? <SpinningSync /> : <Ionicons name="time" size={18} color="#d97706" />}
            <View style={[styles.badge, status === 'syncing' ? styles.badgeBlue : styles.badgeAmber]}>
                <Text style={[styles.badgeText, status === 'syncing' ? styles.textBlue : styles.textAmber]}>
                    {pendingCount}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    badge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    badgeBlue: { backgroundColor: '#dbeafe' },
    badgeAmber: { backgroundColor: '#fef3c7' },
    badgeText: { fontSize: 11, fontWeight: '700' },
    textBlue: { color: '#1d4ed8' },
    textAmber: { color: '#92400e' },
})
```

- [ ] **Step 3: Create `POSHeader.tsx`**

```typescript
// apps/mobile/hormigas_POS/src/utils/components/POSHeader.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import SyncQueueBadge from './SyncQueueBadge'
import { useAuth } from '@/src/login/hooks/useAuth'
import { useNetwork } from '../../../../shared/context/NetworkContext'
import { router } from 'expo-router'

export default function POSHeader() {
    const insets = useSafeAreaInsets()
    const { logout } = useAuth()
    const { isOnline } = useNetwork()

    const handleLogout = async () => {
        await logout()
        router.replace('/(login)')
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
            <View style={styles.row}>
                <View style={styles.brand}>
                    <Ionicons name="storefront" size={28} color="#fff" />
                    <Text style={styles.title}>Hormigas POS</Text>
                </View>
                <View style={styles.right}>
                    <SyncQueueBadge />
                    <Ionicons
                        name={isOnline ? 'wifi' : 'wifi-outline'}
                        size={20}
                        color={isOnline ? '#86efac' : '#fca5a5'}
                        style={{ marginLeft: 12 }}
                    />
                    <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 12 }}>
                        <Ionicons name="log-out-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#1e40af', paddingHorizontal: 16, paddingBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { color: '#fff', fontSize: 18, fontWeight: '700' },
    right: { flexDirection: 'row', alignItems: 'center' },
})
```

Note: `useNetwork` path from `src/utils/components/` goes up 4 levels to reach `apps/mobile/shared/`:
`../../../../shared/context/NetworkContext` ✓

- [ ] **Step 4: Rewrite `app/_layout.tsx`**

```typescript
// apps/mobile/hormigas_POS/app/_layout.tsx
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { useEffect } from 'react'
import { useInitDatabase } from '@/src/utils/hooks/useInitDatabase'
import { useAuth } from '@/src/login/hooks/useAuth'
import { Text } from 'react-native'
import { NetworkProvider } from '../shared/context/NetworkContext'
import POSHeader from '@/src/utils/components/POSHeader'

function AuthGate({ children }: { children: React.ReactNode }) {
    const { token, isLoading } = useAuth()
    useEffect(() => {
        if (isLoading) return
        if (!token) router.replace('/(login)')
    }, [token, isLoading])
    return <>{children}</>
}

export default function RootLayout() {
    const { isReady, error } = useInitDatabase()

    if (error) return <Text>Error iniciando la base de datos</Text>
    if (!isReady) return null

    return (
        <SafeAreaProvider>
            <NetworkProvider>
                <AuthGate>
                    <Stack screenOptions={{ header: () => <POSHeader /> }}>
                        <Stack.Screen name="(login)" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: true }} />
                    </Stack>
                </AuthGate>
            </NetworkProvider>
        </SafeAreaProvider>
    )
}
```

Note: `NetworkProvider` path — from `app/_layout.tsx`, it's `../shared/context/NetworkContext`. Verify this resolves to `apps/mobile/shared/context/NetworkContext.tsx`.

- [ ] **Step 5: Rewrite `app/(tabs)/_layout.tsx`**

```typescript
// apps/mobile/hormigas_POS/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    height: 60,
                    paddingBottom: 8,
                },
            }}
        >
            <Tabs.Screen
                name="pos"
                options={{
                    title: 'POS',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cart" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'Historial',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    )
}
```

- [ ] **Step 6: Create `app/(tabs)/pos.tsx`**

```typescript
// apps/mobile/hormigas_POS/app/(tabs)/pos.tsx
import POSScreen from '@/src/pos/screens/POSScreen'
export default POSScreen
```

- [ ] **Step 7: Create `app/(tabs)/history.tsx`**

```typescript
// apps/mobile/hormigas_POS/app/(tabs)/history.tsx
import HistoryScreen from '@/src/history/screens/HistoryScreen'
export default HistoryScreen
```

- [ ] **Step 8: Delete old placeholder files in POS app**

Remove the template files that are no longer needed:
```bash
rm apps/mobile/hormigas_POS/app/modal.tsx
rm apps/mobile/hormigas_POS/app/\(tabs\)/index.tsx
rm apps/mobile/hormigas_POS/app/\(tabs\)/explore.tsx
```

Also remove unused template components if they import from paths that no longer exist:
```bash
rm -rf apps/mobile/hormigas_POS/components/
rm -rf apps/mobile/hormigas_POS/hooks/
```

- [ ] **Step 9: Verify `NetworkProvider` export from shared**

Check `apps/mobile/shared/context/NetworkContext.tsx` exports `NetworkProvider`. If exported as `export function NetworkProvider`, the import in `_layout.tsx` is: `import { NetworkProvider } from '../shared/context/NetworkContext'`.

- [ ] **Step 10: Run the POS app**

```bash
cd apps/mobile/hormigas_POS && npx expo start --android
```

Expected flow:
1. App opens → DB initializes → redirects to `/(login)` if no token
2. Login with valid credentials → `/(tabs)/pos` appears
3. Search bar shows; type a product name → results appear from local DB (initially empty before pull)
4. Go online → products auto-pulled from server → search works with stock
5. Add items to cart → set monto recibido → tap COBRAR → success modal → cart clears

- [ ] **Step 11: Commit**
```bash
git add apps/mobile/hormigas_POS/
git commit -m "feat(pos): complete POS app - header, sync badge, tab layout, auth guard, route wiring"
```

---

## Self-review checklist

**Spec coverage:**
- [x] Backend: sucursal on Usuario + JWT — Task 1
- [x] Backend: product search with stock — Task 2
- [x] Backend: batch sale endpoint — Task 3
- [x] Domain: Sale entity + DB schema — Task 4
- [x] Application: SaleService + DTOs + interfaces — Task 5
- [x] Infrastructure: SQLite + API repos — Task 6
- [x] POS setup: metro/babel/tsconfig — Task 7
- [x] Auth with sucursalId from JWT — Task 8
- [x] Sale service singleton — Task 9
- [x] Search + cart (usePOS) + POSScreen UI — Task 10
- [x] History screen — Task 11
- [x] Sync badge + Header + app layout wiring — Task 12
- [x] Offline-first: local DB first, sync queue, auto-sync when online — built into SaleService

**Out of scope (confirmed):** card payment, printing, discounts, multi-sucursal switching.
