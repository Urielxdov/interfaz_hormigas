/**
 * Cola de sync y migraciones contra SQLite real (node:sqlite, en memoria).
 */
import { CREATE_TABLES_SQL } from '../../../../domain/database/Schema'
import { SaleService } from '../../../../application/services/sale.service'
import type { IApiSaleRepository, VentaBatchRequest } from '../../../../application/port/sale-api.port'
import type { SyncQueueItem } from '../../../../application/sync/sync.interfaces'
import { SqliteSyncQueueRepositoryImpl, migrateSyncQueue } from '../SqliteSyncQueueRepositoryImpl'
import { SqliteSaleRepositoryImpl } from '../../sale/SqliteSaleRepositoryImpl'
import { SqliteInventaryForSaleImpl } from '../../sale/SqliteInventaryForSaleImpl'
import type { DatabaseClient, RunResult } from '../../../db/contracts/DatabaseClient'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = (process as unknown as { getBuiltinModule(n: string): any }).getBuiltinModule('node:sqlite')

class NodeSqliteClient implements DatabaseClient {
    db = new DatabaseSync(':memory:')
    private inTx = false
    constructor(schema: string = CREATE_TABLES_SQL) { this.db.exec(schema) }
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
    async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
        if (this.inTx) return fn(this)
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

/** sync_queue tal como la creaban las versiones anteriores (sin next_retry_at / owner_id). */
const OLD_SYNC_QUEUE = `
  CREATE TABLE sync_queue (
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
`

const item = (over: Partial<SyncQueueItem>): SyncQueueItem => ({
    id: Math.random().toString(36).slice(2),
    entity: 'venta',
    entityId: 'v1',
    operation: 'CREATE',
    payload: '{}',
    status: 'PENDING',
    retries: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
})

let warn: jest.SpyInstance
beforeEach(() => { warn = jest.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => warn.mockRestore())

describe('migrateSyncQueue', () => {
    it('agrega next_retry_at y owner_id a una base vieja sin perder filas', async () => {
        const db = new NodeSqliteClient(OLD_SYNC_QUEUE)
        await db.run(
            `INSERT INTO sync_queue (id, entity, entity_id, operation, payload, status, retries, created_at, updated_at)
             VALUES ('a', 'venta', 'v1', 'CREATE', '{}', 'PENDING', 2, 'x', 'x')`
        )

        await migrateSyncQueue(db)
        await migrateSyncQueue(db) // idempotente

        const cols = (await db.getMany<{ name: string }>('PRAGMA table_info(sync_queue)')).map(c => c.name)
        expect(cols).toEqual(expect.arrayContaining(['next_retry_at', 'owner_id']))
        const repo = new SqliteSyncQueueRepositoryImpl(db)
        const [row] = await repo.findPending(10)
        expect(row).toMatchObject({ id: 'a', retries: 2, nextRetryAt: null, ownerId: null })
    })

    it('no falla sobre el esquema nuevo', async () => {
        const db = new NodeSqliteClient()
        await expect(migrateSyncQueue(db)).resolves.toBeUndefined()
    })
})

describe('SqliteSyncQueueRepositoryImpl', () => {
    it('findPending respeta next_retry_at, entidad y usuario', async () => {
        const db = new NodeSqliteClient()
        const repo = new SqliteSyncQueueRepositoryImpl(db)
        await repo.save(item({ id: 'listo', createdAt: '2026-01-01T00:00:01.000Z' }))
        await repo.save(item({ id: 'espera', nextRetryAt: '2026-01-01T00:10:00.000Z' }))
        await repo.save(item({ id: 'mov', entity: 'movimiento' }))
        await repo.save(item({ id: 'otro', ownerId: 'b@x.com' }))
        await repo.save(item({ id: 'mio', ownerId: 'a@x.com', createdAt: '2026-01-01T00:00:02.000Z' }))

        const now = '2026-01-01T00:05:00.000Z'
        const ids = (await repo.findPending(10, { entity: 'venta', ownerId: 'a@x.com', now })).map(i => i.id)
        expect(ids).toEqual(['listo', 'mio'])

        const later = (await repo.findPending(10, { entity: 'venta', ownerId: 'a@x.com', now: '2026-01-01T00:10:00.000Z' })).map(i => i.id)
        expect(later).toContain('espera')
    })

    it('scheduleRetry, countByStatus y retryFailed', async () => {
        const db = new NodeSqliteClient()
        const repo = new SqliteSyncQueueRepositoryImpl(db)
        await repo.save(item({ id: 'a' }))
        await repo.save(item({ id: 'b' }))
        await repo.scheduleRetry('a', '2099-01-01T00:00:00.000Z')
        await repo.markAsFailed('b')

        expect(await repo.countByStatus('venta')).toEqual({ pending: 1, failed: 1 })
        expect(await repo.findPending(10)).toHaveLength(0) // 'a' espera backoff

        expect(await repo.retryFailed('venta')).toBe(1)
        const b = (await repo.findByEntity('venta', 'v1')).find(i => i.id === 'b')!
        expect(b).toMatchObject({ status: 'PENDING', retries: 0, nextRetryAt: null })
        const a = (await repo.findByEntity('venta', 'v1')).find(i => i.id === 'a')!
        expect(a.retries).toBe(1)
    })
})

describe('venta heredada + productos desactivados (SQLite real)', () => {
    function build() {
        const db = new NodeSqliteClient()
        const api: IApiSaleRepository & { calls: VentaBatchRequest[]; catalog: any[] } = {
            calls: [],
            catalog: [],
            async registrarVentaBatch(req) {
                this.calls.push(req)
                return { clientId: req.clientId, duplicada: false, procesados: [], rechazados: [] }
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

    it('envia una venta encolada por una version vieja (payload sin clientId/sucursalId)', async () => {
        const { db, svc, api } = build()
        await db.run(`INSERT INTO venta (id, sucursal_id, total, monto_recibido, cambio, fecha, sincronizado)
                      VALUES ('venta-vieja', '7', 40, 50, 10, '2026-01-01T10:00:00.000Z', 0)`)
        await db.run(`INSERT INTO venta_item (id, venta_id, producto_local_id, producto_server_id, nombre, sku, precio, cantidad, subtotal)
                      VALUES ('vi1', 'venta-vieja', 'loc-1', 11, 'Cola', 'C1', 20, 2, 40)`)
        await db.run(`INSERT INTO sync_queue (id, entity, entity_id, operation, payload, status, retries, created_at, updated_at)
                      VALUES ('q1', 'venta', 'venta-vieja', 'CREATE', ?, 'PENDING', 0, 'x', 'x')`,
            [JSON.stringify([{ productoId: 11, cantidad: 2 }])])

        const res = await svc.syncPending()

        expect(res.synced).toBe(1)
        expect(api.calls[0]).toMatchObject({
            clientId: 'venta-vieja',
            sucursalId: 7,
            fecha: '2026-01-01T10:00:00.000Z',
            items: [{ productoId: 11, cantidad: 2, precioUnitario: 20 }],
        })
        const v = await db.getOne<{ sincronizado: number }>(`SELECT sincronizado FROM venta WHERE id = 'venta-vieja'`)
        expect(v!.sincronizado).toBe(1)
    })

    it('el pull marca inactivos los productos que ya no vienen del servidor', async () => {
        const { db, svc, api } = build()
        api.catalog = [
            { id: 11, inventarioId: 100, nombre: 'Cola', sku: 'C1', precio: 20, stockActual: 5 },
            { id: 12, inventarioId: 101, nombre: 'Papas', sku: 'P1', precio: 15, stockActual: 5 },
        ]
        await svc.pullProductsWithStock(7)
        api.catalog = [api.catalog[0]]
        await svc.pullProductsWithStock(7)

        expect(await svc.searchProducts('papas', 7)).toEqual([])
        expect((await svc.searchProducts('cola', 7))).toHaveLength(1)
        const p = await db.getOne<{ activo: number }>('SELECT activo FROM producto WHERE server_id = 12')
        expect(p!.activo).toBe(0)

        // si vuelve a venir, se reactiva
        api.catalog.push({ id: 12, inventarioId: 101, nombre: 'Papas', sku: 'P1', precio: 15, stockActual: 5 })
        await svc.pullProductsWithStock(7)
        expect(await svc.searchProducts('papas', 7)).toHaveLength(1)
    })

    it('rollback de registerSale no deja nada (repos del scope en la transaccion)', async () => {
        const { db, svc, api } = build()
        api.catalog = [{ id: 11, inventarioId: 100, nombre: 'Cola', sku: 'C1', precio: 20, stockActual: 1 }]
        await svc.pullProductsWithStock(7)
        const [cola] = await svc.searchProducts('cola', 7)

        await expect(svc.registerSale({
            items: [{ ...cola, cantidad: 5, subtotal: 100 }],
            sucursalServerId: 7,
            montoRecibido: 100,
        })).rejects.toThrow('Stock insuficiente')
        expect(await db.getMany('SELECT * FROM venta')).toHaveLength(0)
    })
})
