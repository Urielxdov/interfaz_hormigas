import {
  ApiHttpClient,
  ApiUserRepositoryImpl,
  SqliteUserRepositoryImpl,
  TokenServiceImpl,
} from '@hormigas/infrastructure'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

type UserRepos = {
  api: ApiUserRepositoryImpl
  sqlite: SqliteUserRepositoryImpl
}

let _repos: UserRepos | null = null
let _initPromise: Promise<UserRepos> | null = null

export const getUserRepos = (): Promise<UserRepos> => {
  if (_repos) return Promise.resolve(_repos)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const db = await getDB()
    const dbClient = new ExpoSQLiteClient(db)
    const tokenService = new TokenServiceImpl(storage)
    const httpClient = new ApiHttpClient(API_URL, tokenService)

    _repos = {
      api: new ApiUserRepositoryImpl(httpClient),
      sqlite: new SqliteUserRepositoryImpl(dbClient),
    }
    return _repos
  })()

  return _initPromise
}
