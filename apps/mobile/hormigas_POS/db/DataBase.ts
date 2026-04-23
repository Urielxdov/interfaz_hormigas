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
  try {
    const db = await getDB()
    await db.execAsync(CREATE_TABLES_SQL)
    console.log('✅ POS DB lista')
  } catch (e) {
    console.error('❌ Error en initDatabase:', JSON.stringify(e))
    throw e
  }
}
