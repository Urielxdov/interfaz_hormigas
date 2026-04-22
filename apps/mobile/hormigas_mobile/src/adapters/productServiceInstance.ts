import {
    ApiHttpClient,
    SqliteProductRepositoryImpl,
    SqliteSyncQueueRepositoryImpl,
    ApiProductRepositoryImpl,
    TokenServiceImpl,
} from '@hormigas/infrastructure'
import { createProductService, ProductService } from '@hormigas/application'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _service: ProductService | null = null
let _initPromise: Promise<ProductService> | null = null

export const getProductService = (): Promise<ProductService> => {
    if (_service) return Promise.resolve(_service)
    if (_initPromise) return _initPromise

    _initPromise = (async () => {
        const db = await getDB()
        const dbClient = new ExpoSQLiteClient(db)
        const tokenService = new TokenServiceImpl(storage)
        const httpClient = new ApiHttpClient(API_URL, tokenService)

        const productRepo = new SqliteProductRepositoryImpl(dbClient)
        const syncQueueRepo = new SqliteSyncQueueRepositoryImpl(dbClient)
        const apiProductRepo = new ApiProductRepositoryImpl(httpClient)

        _service = createProductService(productRepo, syncQueueRepo, apiProductRepo)
        return _service
    })()

    return _initPromise
}
