import * as SQLite from 'expo-sqlite'
import { CREATE_TABLES_SQL } from '@hormigas/domain'

let db: SQLite.SQLiteDatabase | null = null

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('hormigas.db')
  }
  return db
}

const INVENTARIO_MIGRATIONS = [
  `ALTER TABLE inventario ADD COLUMN producto_nombre TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE inventario ADD COLUMN sucursal_nombre TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE inventario ADD COLUMN precio REAL`,
  `ALTER TABLE inventario ADD COLUMN synced_at INTEGER NOT NULL DEFAULT 0`,
]

export const initDatabase = async () => {
  try {
    const db = await getDB()
    await db.execAsync(CREATE_TABLES_SQL)
    for (const sql of INVENTARIO_MIGRATIONS) {
      try {
        await db.execAsync(sql)
      } catch {
        // column already exists — ignore
      }
    }
    console.log('✅ Base de datos lista')
  } catch (e) {
    console.error('❌ Error en initDatabase:', JSON.stringify(e))
    throw e
  }
}
