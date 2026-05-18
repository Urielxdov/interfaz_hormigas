import {
  ApiHttpClient,
  ApiInventarioRepositoryImpl,
  SqliteInventarioRepositoryImpl,
  TokenServiceImpl,
} from '@hormigas/infrastructure'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

type InventarioRepos = {
  api: ApiInventarioRepositoryImpl
  sqlite: SqliteInventarioRepositoryImpl
}

let _repos: InventarioRepos | null = null
let _initPromise: Promise<InventarioRepos> | null = null

export const getInventarioRepos = (): Promise<InventarioRepos> => {
  if (_repos) return Promise.resolve(_repos)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const db = await getDB()
    const dbClient = new ExpoSQLiteClient(db)
    const tokenService = new TokenServiceImpl(storage)
    const httpClient = new ApiHttpClient(API_URL, tokenService)
    _repos = {
      api: new ApiInventarioRepositoryImpl(httpClient),
      sqlite: new SqliteInventarioRepositoryImpl(dbClient),
    }
    return _repos
  })()

  return _initPromise
}
