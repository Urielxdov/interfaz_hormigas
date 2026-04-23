import {
  ApiHttpClient,
  SqliteSyncQueueRepositoryImpl,
  TokenServiceImpl,
  ApiPOSRepositoryImpl,
  SqlitePOSCacheRepositoryImpl,
} from '@hormigas/infrastructure'
import { createPOSService, POSService } from '@hormigas/application'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _service: POSService | null = null
let _initPromise: Promise<POSService> | null = null

export const getPOSService = (): Promise<POSService> => {
  if (_service) return Promise.resolve(_service)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const db = await getDB()
    const dbClient = new ExpoSQLiteClient(db)
    const tokenService = new TokenServiceImpl(storage)
    const httpClient = new ApiHttpClient(API_URL, tokenService)

    const apiRepo = new ApiPOSRepositoryImpl(httpClient)
    const cacheRepo = new SqlitePOSCacheRepositoryImpl(dbClient)
    const syncQueueRepo = new SqliteSyncQueueRepositoryImpl(dbClient)

    _service = createPOSService(apiRepo, cacheRepo, syncQueueRepo)
    return _service
  })()

  return _initPromise
}
