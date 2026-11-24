/**
 * Prueba la capa SQLite de ventas contra un SQLite real (node:sqlite, en memoria)
 * usando el mismo esquema que la app (CREATE_TABLES_SQL).
 */
import { CREATE_TABLES_SQL } from '../../../../domain/database/Schema'
import { SaleService, InsufficientStockError } from '../../../../application/services/sale.service'
import type { IApiSaleRepository, VentaBatchRequest } from '../../../../application/port/sale-api.port'
import { SqliteSaleRepositoryImpl } from '../SqliteSaleRepositoryImpl'
import { SqliteInventaryForSaleImpl } from '../SqliteInventaryForSaleImpl'
import { SqliteSyncQueueRepositoryImpl } from '../../sync/SqliteSyncQueueRepositoryImpl'
import type { DatabaseClient, RunResult } from '../../../db/contracts/DatabaseClient'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = (process as unknown as { getBuiltinModule(n: string): any }).getBuiltinModule('node:sqlite')

class NodeSqliteClient implements DatabaseClient {
    private db = new DatabaseSync(':memory:')
    constructor() { this.db.exec(CREATE_TABLES_SQL) }
    async run(query: string, params: unknown[] = []): Promise<RunResult> {
        const r = this.db.prepare(query).run(...params)
        return { changes: Number(r.changes) }
    }
    async getOne<T>(query: string, params: unknown[] = []): Promise<T | null> {
        return (this.db.prepare(query).get(...params) as T | undefined) ?? null
    }
    async getMany<T>(query: string, params: unknown[] = []): Promise<T[]> {
        return this.db.prepare(query).all(...params) as T[]
    }
    private inTx = false
    async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
        if (this.inTx) return fn(this)   // anidada: reutiliza la transaccion en curso
        this.db.exec('BEGIN')
        this.inTx = true
        try {
            const out = await fn(this)
            this.db.exec('COMMIT')
            return out
        } catch (e) {
            this.db.exec('ROLLBACK')
            throw e
        } finally {
            this.inTx = false
        }
    }
}

const SUCURSAL = 7

function build() {
    const db = new NodeSqliteClient()
    const api: IApiSaleRepository & { calls: VentaBatchRequest[]; catalog: any[] } = {
        calls: [],
        catalog: [],
        async registrarVentaBatch(req) {
            this.calls.push(req)
            return { clientId: req.clientId, duplicada: false, rechazados: [] }
        },
        async buscarProductosConStock() { return this.catalog },
    }
    const svc = new SaleService(
        new SqliteSaleRepositoryImpl(db),
        new SqliteInventaryForSaleImpl(db),
        new SqliteSyncQueueRepositoryImpl(db),
        api,
        {
            run: fn => db.transaction(tx => fn({
                saleRepo: new SqliteSaleRepositoryImpl(tx),
                inventaryRepo: new SqliteInventaryForSaleImpl(tx),
                syncQueueRepo: new SqliteSyncQueueRepositoryImpl(tx),
            })),
        }
    )
    return { db, svc, api }
}

async function pullCatalog(ctx: ReturnType<typeof build>, stockCola = 10, stockPapas = 1) {
    ctx.api.catalog = [
        { id: 11, inventarioId: 100, nombre: 'Cola', sku: 'C1', precio: 20, stockActual: stockCola },
        { id: 12, inventarioId: 101, nombre: 'Papas', sku: 'P1', precio: 15, stockActual: stockPapas },
    ]
    await ctx.svc.pullProductsWithStock(SUCURSAL)
}

async function find(ctx: ReturnType<typeof build>, q: string) {
    const [p] = await ctx.svc.searchProducts(q, SUCURSAL)
    return p
}

const asCartItem = (p: { productoLocalId: string; productoServerId: number | null; nombre: string; sku: string; precio: number }, cantidad: number) =>
    ({ ...p, cantidad, subtotal: p.precio * cantidad })

let warn: jest.SpyInstance
beforeEach(() => { warn = jest.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => warn.mockRestore())

describe('pull + busqueda (SQLite real)', () => {
    it('el pull llena producto y la busqueda lo encuentra con su stock', async () => {
        const ctx = build()
        expect(await ctx.svc.searchProducts('cola', SUCURSAL)).toEqual([])   // antes: tabla vacia

        await pullCatalog(ctx)

        const cola = await find(ctx, 'cola')
        expect(cola).toMatchObject({ productoServerId: 11, nombre: 'Cola', precio: 20, stockActual: 10 })
    })

    it('un segundo pull actualiza sin duplicar productos', async () => {
        const ctx = build()
        await pullCatalog(ctx, 10)
        const first = await find(ctx, 'cola')
        await pullCatalog(ctx, 6)

        const rows = await ctx.db.getMany('SELECT * FROM producto WHERE server_id = 11')
        expect(rows).toHaveLength(1)
        const second = await find(ctx, 'cola')
        expect(second.productoLocalId).toBe(first.productoLocalId)   // mismo local_id
        expect(second.stockActual).toBe(6)
    })
})

describe('registerSale (SQLite real)', () => {
    it('descuenta stock y deja venta + cola', async () => {
        const ctx = build()
        await pullCatalog(ctx)
        const cola = await find(ctx, 'cola')

        const sale = await ctx.svc.registerSale({ items: [asCartItem(cola, 3)], sucursalServerId: SUCURSAL, montoRecibido: 100 })

        expect((await find(ctx, 'cola')).stockActual).toBe(7)
        expect(await ctx.db.getMany('SELECT * FROM sync_queue')).toHaveLength(1)
        const v = await ctx.db.getOne<{ sincronizado: number }>('SELECT sincronizado FROM venta WHERE id = ?', [sale.localId])
        expect(v!.sincronizado).toBe(0)
    })

    it('stock nunca queda negativo: UPDATE condicional y rollback completo', async () => {
        const ctx = build()
        await pullCatalog(ctx, 10, 1)
        const cola = await find(ctx, 'cola')
        const papas = await find(ctx, 'papas')

        await expect(
            ctx.svc.registerSale({ items: [asCartItem(cola, 2), asCartItem(papas, 5)], sucursalServerId: SUCURSAL, montoRecibido: 500 })
        ).rejects.toBeInstanceOf(InsufficientStockError)

        // cola se descontaba primero, pero la transaccion se revirtio
        expect((await find(ctx, 'cola')).stockActual).toBe(10)
        expect((await find(ctx, 'papas')).stockActual).toBe(1)
        expect(await ctx.db.getMany('SELECT * FROM venta')).toHaveLength(0)
        expect(await ctx.db.getMany('SELECT * FROM venta_item')).toHaveLength(0)
        expect(await ctx.db.getMany('SELECT * FROM sync_queue')).toHaveLength(0)
    })

    it('dos ventas seguidas no pueden vender mas stock del que hay', async () => {
        const ctx = build()
        await pullCatalog(ctx, 5)
        const cola = await find(ctx, 'cola')

        await ctx.svc.registerSale({ items: [asCartItem(cola, 4)], sucursalServerId: SUCURSAL, montoRecibido: 100 })
        await expect(
            ctx.svc.registerSale({ items: [asCartItem(cola, 4)], sucursalServerId: SUCURSAL, montoRecibido: 100 })
        ).rejects.toBeInstanceOf(InsufficientStockError)

        expect((await find(ctx, 'cola')).stockActual).toBe(1)
    })
})

describe('sync + pull con ventas pendientes (SQLite real)', () => {
    it('syncPending marca venta.sincronizado = 1 y la cola DONE', async () => {
        const ctx = build()
        await pullCatalog(ctx)
        const cola = await find(ctx, 'cola')
        const sale = await ctx.svc.registerSale({ items: [asCartItem(cola, 2)], sucursalServerId: SUCURSAL, montoRecibido: 100 })

        const res = await ctx.svc.syncPending()

        expect(res.synced).toBe(1)
        const v = await ctx.db.getOne<{ sincronizado: number }>('SELECT sincronizado FROM venta WHERE id = ?', [sale.localId])
        expect(v!.sincronizado).toBe(1)
        const q = await ctx.db.getOne<{ status: string }>('SELECT status FROM sync_queue')
        expect(q!.status).toBe('DONE')
        expect((await ctx.svc.getHistory())[0].sincronizado).toBe(true)
        expect(ctx.api.calls[0]).toMatchObject({ sucursalId: SUCURSAL, items: [{ productoId: 11, cantidad: 2, precioUnitario: 20 }] })
    })

    it('un pull NO pisa el stock con el valor del servidor mientras hay ventas pendientes', async () => {
        const ctx = build()
        await pullCatalog(ctx, 10)
        const cola = await find(ctx, 'cola')
        await ctx.svc.registerSale({ items: [asCartItem(cola, 3)], sucursalServerId: SUCURSAL, montoRecibido: 100 })
        // el servidor aun cree que hay 10 (la venta no se ha sincronizado)
        await pullCatalog(ctx, 10)

        expect((await find(ctx, 'cola')).stockActual).toBe(7)
    })

    it('tras sincronizar, el pull ya toma el stock del servidor tal cual', async () => {
        const ctx = build()
        await pullCatalog(ctx, 10)
        const cola = await find(ctx, 'cola')
        await ctx.svc.registerSale({ items: [asCartItem(cola, 3)], sucursalServerId: SUCURSAL, montoRecibido: 100 })
        await ctx.svc.syncPending()
        await pullCatalog(ctx, 7)   // el servidor ya descontó 3

        expect((await find(ctx, 'cola')).stockActual).toBe(7)
    })
})
