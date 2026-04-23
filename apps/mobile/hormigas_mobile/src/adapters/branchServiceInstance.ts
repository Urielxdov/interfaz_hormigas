import {
  ApiHttpClient,
  SqliteBranchRepositoryImpl,
  SqliteSyncQueueRepositoryImpl,
  ApiBranchRepositoryImpl,
  TokenServiceImpl,
} from '@hormigas/infrastructure'
import { createBranchService, BranchService } from '@hormigas/application'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _service: BranchService | null = null
let _initPromise: Promise<BranchService> | null = null

export const getBranchService = (): Promise<BranchService> => {
  if (_service) return Promise.resolve(_service)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const db = await getDB()
    const dbClient = new ExpoSQLiteClient(db)
    const tokenService = new TokenServiceImpl(storage)
    const httpClient = new ApiHttpClient(API_URL, tokenService)

    const branchRepo = new SqliteBranchRepositoryImpl(dbClient)
    const syncQueueRepo = new SqliteSyncQueueRepositoryImpl(dbClient)
    const apiBranchRepo = new ApiBranchRepositoryImpl(httpClient)

    _service = createBranchService(branchRepo, syncQueueRepo, apiBranchRepo)
    return _service
  })()

  return _initPromise
}
