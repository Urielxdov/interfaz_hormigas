import {
    SqliteSaleRepositoryImpl,
    SqliteInventaryForSaleImpl,
    SqliteSyncQueueRepositoryImpl,
    ApiSaleRepositoryImpl,
    ApiHttpClient,
    TokenServiceImpl,
} from '@hormigas/infrastructure'
import { SaleService } from '@hormigas/application'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _service: SaleService | null = null
let _initPromise: Promise<SaleService> | null = null

export const getSaleService = (): Promise<SaleService> => {
    if (_service) return Promise.resolve(_service)
    if (_initPromise) return _initPromise

    _initPromise = (async () => {
        const db = await getDB()
        const client = new ExpoSQLiteClient(db)
        const tokenService = new TokenServiceImpl(storage)
        const http = new ApiHttpClient(API_URL, tokenService)

        _service = new SaleService(
            new SqliteSaleRepositoryImpl(client),
            new SqliteInventaryForSaleImpl(client),
            new SqliteSyncQueueRepositoryImpl(client),
            new ApiSaleRepositoryImpl(http)
        )
        return _service
    })()

    return _initPromise
}
