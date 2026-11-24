/**
 * Base local unica (inventario + POS) contra SQLite real (node:sqlite, en memoria):
 * migracion de instalaciones anteriores y convivencia de la cola de sync.
 */
import { CREATE_TABLES_SQL } from '../../../../domain/database/Schema'
import type { SyncQueueItem } from '../../../../application/sync/sync.interfaces'
import { migrateLocalSchema, addMissingColumns, INVENTARIO_COLUMNS } from '../localSchemaMigrations'
import { SqliteSyncQueueRepositoryImpl } from '../../../src/sync/SqliteSyncQueueRepositoryImpl'
import { SqliteInventaryForSaleImpl } from '../../../src/sale/SqliteInventaryForSaleImpl'
import { SqliteInventarioRepositoryImpl } from '../../../src/inventario/SqliteInventarioRepositoryImpl'
import type { DatabaseClient, RunResult } from '../../contracts/DatabaseClient'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = (process as unknown as { getBuiltinModule(n: string): any }).getBuiltinModule('node:sqlite')

class NodeSqliteClient implements DatabaseClient {
    db = new DatabaseSync(':memory:')
    private inTx = false
    constructor(schema?: string) { if (schema) this.db.exec(schema) }
    exec(sql: string) { this.db.exec(sql) }
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

/** Tablas como las dejaba una instalacion vieja de hormigas_mobile (sin cache en inventario ni POS). */
const OLD_MOBILE_SCHEMA = `
  CREATE TABLE sucursal (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, direccion TEXT,
    activa INTEGER NOT NULL DEFAULT 1, empresa_id INTEGER);
  CREATE TABLE inventario (
    id INTEGER PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER,
    stock_maximo INTEGER NOT NULL,
    ultima_actualizacion TEXT,
    UNIQUE (sucursal_id, producto_id)
  );
  CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY NOT NULL, entity TEXT NOT NULL, entity_id TEXT NOT NULL,
    operation TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
    retries INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
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

const tableColumns = async (db: DatabaseClient, table: string) =>
    (await db.getMany<{ name: string }>(`PRAGMA table_info(${table})`)).map(c => c.name)

describe('migrateLocalSchema', () => {
    it('actualiza una base vieja de inventario sin perder filas y crea las tablas del POS', async () => {
        const db = new NodeSqliteClient(OLD_MOBILE_SCHEMA)
        await db.run(`INSERT INTO sucursal (id, nombre) VALUES (1, 'Centro')`)
        await db.run(`INSERT INTO inventario (id, producto_id, sucursal_id, stock_actual, stock_maximo) VALUES (7, 3, 1, 5, 10)`)
        await db.run(
            `INSERT INTO sync_queue (id, entity, entity_id, operation, payload, status, retries, created_at, updated_at)
             VALUES ('p1', 'producto', 'loc-1', 'CREATE', '{}', 'PENDING', 1, 'x', 'x')`
        )

        db.exec(CREATE_TABLES_SQL)
        await migrateLocalSchema(db)
        await migrateLocalSchema(db) // idempotente (se corre en cada arranque)

        expect(await tableColumns(db, 'inventario')).toEqual(
            expect.arrayContaining(['producto_nombre', 'sucursal_nombre', 'precio', 'synced_at'])
        )
        expect(await tableColumns(db, 'sync_queue')).toEqual(expect.arrayContaining(['next_retry_at', 'owner_id']))
        expect(await tableColumns(db, 'venta')).toContain('sincronizado')
        expect(await tableColumns(db, 'venta_item')).toContain('producto_server_id')

        const inv = await db.getOne<Record<string, unknown>>('SELECT * FROM inventario WHERE id = 7')
        expect(inv).toMatchObject({ stock_actual: 5, producto_nombre: '', synced_at: 0 })
        const [queued] = await new SqliteSyncQueueRepositoryImpl(db).findPending(10, { entity: 'producto' })
        expect(queued).toMatchObject({ id: 'p1', retries: 1, ownerId: null })
    })

    it('no falla sobre el esquema actual', async () => {
        const db = new NodeSqliteClient(CREATE_TABLES_SQL)
        await expect(migrateLocalSchema(db)).resolves.toBeUndefined()
        expect(await addMissingColumns(db, 'inventario', INVENTARIO_COLUMNS)).toEqual([])
    })
})

describe('inventario compartido entre el POS y la vista de inventario', () => {
    it('el pull del POS actualiza stock sin borrar nombres ni minimos de la vista de inventario', async () => {
        const db = new NodeSqliteClient(CREATE_TABLES_SQL)
        await db.run(`INSERT INTO sucursal (id, nombre) VALUES (1, 'Centro')`)
        await new SqliteInventarioRepositoryImpl(db).upsertMany([{
            id: 7, productoId: 3, productoNombre: 'Cafe', sucursalId: 1, sucursalNombre: 'Centro',
            precio: 25, stockActual: 5, stockMinimo: 2, stockMaximo: 50,
        }])

        const pos = new SqliteInventaryForSaleImpl(db)
        await pos.upsertFromServer(7, 3, 1, 12) // pull del POS: sin min/max

        const row = await db.getOne<Record<string, unknown>>('SELECT * FROM inventario WHERE id = 7')
        expect(row).toMatchObject({
            stock_actual: 12, producto_nombre: 'Cafe', sucursal_nombre: 'Centro', precio: 25,
            stock_minimo: 2, stock_maximo: 50,
        })

        await pos.upsertFromServer(7, 3, 1, 12, 4, 40) // pull de movimientos: con min/max
        expect(await db.getOne('SELECT stock_minimo, stock_maximo FROM inventario WHERE id = 7'))
            .toEqual({ stock_minimo: 4, stock_maximo: 40 })
    })

    it('inserta la fila con valores por defecto si no existe', async () => {
        const db = new NodeSqliteClient(CREATE_TABLES_SQL)
        await new SqliteInventaryForSaleImpl(db).upsertFromServer(9, 4, 2, 3)
        expect(await db.getOne('SELECT stock_actual, stock_minimo, stock_maximo FROM inventario WHERE id = 9'))
            .toEqual({ stock_actual: 3, stock_minimo: 0, stock_maximo: 9999 })
        expect(await db.getOne('SELECT nombre FROM sucursal WHERE id = 2')).toEqual({ nombre: 'Sucursal #2' })
    })
})

describe('cola de sync compartida', () => {
    it('muchas ventas pendientes no ocultan los pendientes de inventario (filtro por entidad)', async () => {
        const db = new NodeSqliteClient(CREATE_TABLES_SQL)
        const repo = new SqliteSyncQueueRepositoryImpl(db)
        for (let i = 0; i < 30; i++) await repo.save(item({ id: `v${i}`, entityId: `v${i}` }))
        await repo.save(item({ id: 'prod', entity: 'producto', createdAt: '2026-02-01T00:00:00.000Z' }))
        await repo.save(item({ id: 'mov', entity: 'movimiento', createdAt: '2026-02-01T00:00:00.000Z' }))

        expect((await repo.findPending(20)).map(i => i.id)).not.toContain('prod')
        expect((await repo.findPending(20, { entity: 'producto' })).map(i => i.id)).toEqual(['prod'])
        expect((await repo.findPending(50, { entity: 'movimiento' })).map(i => i.id)).toEqual(['mov'])
        expect(await repo.countByStatus('venta')).toEqual({ pending: 30, failed: 0 })
    })
})
