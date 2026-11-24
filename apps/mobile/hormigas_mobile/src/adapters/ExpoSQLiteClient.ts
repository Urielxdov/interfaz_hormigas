import * as SQLite from 'expo-sqlite'
import { DatabaseClient } from '@hormigas/infrastructure'

type BindParams = SQLite.SQLiteBindValue[]

/**
 * Cola de transacciones por base de datos (compartida entre todos los clientes que usan
 * la misma conexion). Las transacciones corren de una en una, y las consultas fuera de
 * transaccion esperan a que termine la que este en curso.
 */
const txTails = new WeakMap<SQLite.SQLiteDatabase, Promise<void>>()

export class ExpoSQLiteClient implements DatabaseClient {
    /**
     * @param db conexion principal, o la conexion de la transaccion (`inTransaction`)
     */
    constructor(private db: SQLite.SQLiteDatabase, private inTransaction = false) {}

    private async ready(): Promise<void> {
        if (this.inTransaction) return
        await txTails.get(this.db)
    }

    async run(query: string, params?: unknown[]): Promise<{ changes: number }> {
        await this.ready()
        const res = await this.db.runAsync(query, (params ?? []) as BindParams)
        return { changes: res.changes }
    }

    /**
     * withExclusiveTransactionAsync usa una conexion aparte: solo lo que se ejecute con `tx`
     * entra en la transaccion (otras consultas concurrentes de la app no se mezclan ni se
     * revierten con ella).
     */
    async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
        if (this.inTransaction) return fn(this)

        const prev = txTails.get(this.db) ?? Promise.resolve()
        let release!: () => void
        const current = new Promise<void>(r => { release = r })
        const tail = prev.then(() => current)
        txTails.set(this.db, tail)

        await prev
        try {
            let result!: T
            await this.db.withExclusiveTransactionAsync(async txn => {
                // La conexion de la transaccion es nueva: sin busy_timeout falla con
                // "database is locked" en cuanto la principal esta leyendo/escribiendo.
                await txn.execAsync('PRAGMA busy_timeout = 5000;')
                result = await fn(new ExpoSQLiteClient(txn, true))
            })
            return result
        } finally {
            release()
            if (txTails.get(this.db) === tail) txTails.delete(this.db)
        }
    }

    async getOne<T>(query: string, params?: unknown[]): Promise<T | null> {
        await this.ready()
        return this.db.getFirstAsync<T>(query, (params ?? []) as BindParams)
    }

    async getMany<T>(query: string, params?: unknown[]): Promise<T[]> {
        await this.ready()
        return this.db.getAllAsync<T>(query, (params ?? []) as BindParams)
    }
}
