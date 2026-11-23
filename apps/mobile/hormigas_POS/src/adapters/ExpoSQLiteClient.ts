import * as SQLite from 'expo-sqlite'
import { DatabaseClient } from '@hormigas/infrastructure'

type BindParams = SQLite.SQLiteBindValue[]

export class ExpoSQLiteClient implements DatabaseClient {
    constructor(private db: SQLite.SQLiteDatabase) {}

    async run(query: string, params?: unknown[]): Promise<{ changes: number }> {
        const res = await this.db.runAsync(query, (params ?? []) as BindParams)
        return { changes: res.changes }
    }

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
        let result!: T
        await this.db.withTransactionAsync(async () => {
            result = await fn()
        })
        return result
    }

    async getOne<T>(query: string, params?: unknown[]): Promise<T | null> {
        return this.db.getFirstAsync<T>(query, (params ?? []) as BindParams)
    }

    async getMany<T>(query: string, params?: unknown[]): Promise<T[]> {
        return this.db.getAllAsync<T>(query, (params ?? []) as BindParams)
    }
}
