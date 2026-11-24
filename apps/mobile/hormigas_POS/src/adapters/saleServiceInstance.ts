import {
    SqliteSaleRepositoryImpl,
    SqliteInventaryForSaleImpl,
    SqliteSyncQueueRepositoryImpl,
    ApiSaleRepositoryImpl,
    ApiHttpClient,
    TokenServiceImpl,
} from '@hormigas/infrastructure'
import { SaleService, setUUIDGenerator } from '@hormigas/application'
import * as Crypto from 'expo-crypto'
import { getDB, initDatabase } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

// UUIDs criptograficos (clientId de las ventas); Hermes no trae crypto.randomUUID.
setUUIDGenerator(() => Crypto.randomUUID())

let _service: SaleService | null = null
let _initPromise: Promise<SaleService> | null = null

export const getSaleService = (): Promise<SaleService> => {
    if (_service) return Promise.resolve(_service)
    if (_initPromise) return _initPromise

    _initPromise = (async () => {
        await initDatabase()
        const db = await getDB()
        const client = new ExpoSQLiteClient(db)
        const tokenService = new TokenServiceImpl(storage)
        const http = new ApiHttpClient(API_URL, tokenService)

        _service = new SaleService(
            new SqliteSaleRepositoryImpl(client),
            new SqliteInventaryForSaleImpl(client),
            new SqliteSyncQueueRepositoryImpl(client),
            new ApiSaleRepositoryImpl(http),
            {
                // Los repositorios del scope usan la conexion de la transaccion.
                run: fn => client.transaction(tx => fn({
                    saleRepo: new SqliteSaleRepositoryImpl(tx),
                    inventaryRepo: new SqliteInventaryForSaleImpl(tx),
                    syncQueueRepo: new SqliteSyncQueueRepositoryImpl(tx),
                })),
            }
        )
        return _service
    })()

    return _initPromise
}
