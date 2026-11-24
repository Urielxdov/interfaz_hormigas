import * as SQLite from 'expo-sqlite'
import { CREATE_TABLES_SQL } from '@hormigas/domain'
import { migrateLocalSchema } from '@hormigas/infrastructure'
import { ExpoSQLiteClient } from '@/src/adapters/ExpoSQLiteClient'

/**
 * Base local unica de la app: inventario (producto, inventario, sucursal, movimiento, usuario)
 * y POS (venta, venta_item). Ambos usan la misma sync_queue, separada por `entity`.
 */
const DB_NAME = 'hormigas.db'

let db: SQLite.SQLiteDatabase | null = null
let initPromise: Promise<void> | null = null

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        db = await SQLite.openDatabaseAsync(DB_NAME)
    }
    return db
}

const runDatabaseInit = async () => {
    const database = await getDB()
    // Esperar en vez de fallar con SQLITE_BUSY si otra conexion (transaccion) tiene el lock.
    await database.execAsync('PRAGMA busy_timeout = 5000;')
    await database.execAsync(CREATE_TABLES_SQL)
    // Instalaciones anteriores: columnas nuevas de sync_queue (next_retry_at, owner_id) e
    // inventario (cache), agregadas solo si faltan (PRAGMA table_info).
    await migrateLocalSchema(new ExpoSQLiteClient(database))
    if (__DEV__) console.log('[DB] lista')
}

export const initDatabase = async () => {
    if (!initPromise) {
        initPromise = runDatabaseInit().catch((e) => {
            initPromise = null
            console.error('[DB] Error en initDatabase:', e)
            throw e
        })
    }

    return initPromise
}
