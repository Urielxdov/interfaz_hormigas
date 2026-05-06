import { SqliteSyncQueueRepositoryImpl } from '@hormigas/infrastructure'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'

let _repo: SqliteSyncQueueRepositoryImpl | null = null
let _initPromise: Promise<SqliteSyncQueueRepositoryImpl> | null = null

export const getSyncQueueRepo = (): Promise<SqliteSyncQueueRepositoryImpl> => {
    if (_repo) return Promise.resolve(_repo)
    if (_initPromise) return _initPromise

    _initPromise = (async () => {
        const db = await getDB()
        const dbClient = new ExpoSQLiteClient(db)
        _repo = new SqliteSyncQueueRepositoryImpl(dbClient)
        return _repo
    })()

    return _initPromise
}
