import {
  ApiHttpClient,
  ApiBranchRepositoryImpl,
  SqliteBranchRepositoryImpl,
  TokenServiceImpl,
} from '@hormigas/infrastructure'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

type BranchRepos = {
  api: ApiBranchRepositoryImpl
  sqlite: SqliteBranchRepositoryImpl
}

let _repos: BranchRepos | null = null
let _initPromise: Promise<BranchRepos> | null = null

export const getBranchRepos = (): Promise<BranchRepos> => {
  if (_repos) return Promise.resolve(_repos)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const db = await getDB()
    const dbClient = new ExpoSQLiteClient(db)
    const tokenService = new TokenServiceImpl(storage)
    const httpClient = new ApiHttpClient(API_URL, tokenService)

    _repos = {
      api: new ApiBranchRepositoryImpl(httpClient),
      sqlite: new SqliteBranchRepositoryImpl(dbClient),
    }
    return _repos
  })()

  return _initPromise
}
