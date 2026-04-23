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
