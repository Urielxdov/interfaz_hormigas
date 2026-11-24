import * as SQLite from 'expo-sqlite'
import { CREATE_TABLES_SQL } from '@hormigas/domain'
import { migrateSyncQueue } from '@hormigas/infrastructure'
import { ExpoSQLiteClient } from '@/src/adapters/ExpoSQLiteClient'

let db: SQLite.SQLiteDatabase | null = null
let initPromise: Promise<void> | null = null

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('hormigas_pos.db')
    }
    return db
}

const runDatabaseInit = async () => {
    const database = await getDB()
    // Esperar en vez de fallar con SQLITE_BUSY si otra conexion (transaccion) tiene el lock.
    await database.execAsync('PRAGMA busy_timeout = 5000;')
    await database.execAsync(CREATE_TABLES_SQL)
    // Bases instaladas con versiones anteriores: columnas nuevas de sync_queue.
    await migrateSyncQueue(new ExpoSQLiteClient(database))
    console.log('[POS] DB lista')
}

export const initDatabase = async () => {
    if (!initPromise) {
        initPromise = runDatabaseInit().catch(e => {
            initPromise = null
            console.error('[POS] Error en initDatabase:', e)
            throw e
        })
    }
    return initPromise
}
