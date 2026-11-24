import { DatabaseClient } from '../contracts/DatabaseClient'
import { migrateSyncQueue } from '../../src/sync/SqliteSyncQueueRepositoryImpl'

export type ColumnMigration = { name: string; ddl: string }

/**
 * Agrega a `table` las columnas que falten (PRAGMA table_info). Idempotente: una columna
 * que ya existe no se toca, asi que se puede llamar en cada arranque.
 * Devuelve los nombres de las columnas agregadas.
 */
export async function addMissingColumns(
    db: DatabaseClient,
    table: string,
    columns: ColumnMigration[]
): Promise<string[]> {
    const cols = await db.getMany<{ name: string }>(`PRAGMA table_info(${table})`)
    const existing = new Set(cols.map(c => c.name))
    const added: string[] = []
    for (const col of columns) {
        if (existing.has(col.name)) continue
        await db.run(col.ddl)
        added.push(col.name)
    }
    return added
}

/** Columnas de cache agregadas a `inventario` despues de la primera version. */
export const INVENTARIO_COLUMNS: ColumnMigration[] = [
    { name: 'producto_nombre', ddl: `ALTER TABLE inventario ADD COLUMN producto_nombre TEXT NOT NULL DEFAULT ''` },
    { name: 'sucursal_nombre', ddl: `ALTER TABLE inventario ADD COLUMN sucursal_nombre TEXT NOT NULL DEFAULT ''` },
    { name: 'precio', ddl: 'ALTER TABLE inventario ADD COLUMN precio REAL' },
    { name: 'synced_at', ddl: 'ALTER TABLE inventario ADD COLUMN synced_at INTEGER NOT NULL DEFAULT 0' },
]

/** Columnas agregadas a `producto`: categoria real del servidor y stock total. */
export const PRODUCTO_COLUMNS: ColumnMigration[] = [
    { name: 'categoria_id', ddl: 'ALTER TABLE producto ADD COLUMN categoria_id INTEGER' },
    { name: 'stock_total', ddl: 'ALTER TABLE producto ADD COLUMN stock_total INTEGER' },
]

/**
 * Migraciones de la base local unica (inventario + POS). Llamar despues de CREATE_TABLES_SQL:
 * las tablas nuevas (venta, venta_item, ...) las crea el CREATE TABLE IF NOT EXISTS; aqui solo
 * se agregan columnas a tablas que ya existian en instalaciones anteriores.
 */
export async function migrateLocalSchema(db: DatabaseClient): Promise<void> {
    await migrateSyncQueue(db)
    await addMissingColumns(db, 'inventario', INVENTARIO_COLUMNS)
    await addMissingColumns(db, 'producto', PRODUCTO_COLUMNS)
    await db.run('CREATE INDEX IF NOT EXISTS idx_venta_sincronizado ON venta (sincronizado, sucursal_id)')
}
