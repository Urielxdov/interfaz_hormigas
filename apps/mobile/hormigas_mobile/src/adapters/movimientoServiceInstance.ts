import { ApiHttpClient, SqliteSyncQueueRepositoryImpl, SqliteInventaryForSaleImpl, TokenServiceImpl } from '@hormigas/infrastructure'
import { createMovimientoService, MovimientoSyncService, IMovimientoApi, MovimientoDTO, MovimientoPage, CrearMovimientoDTO, InventarioResponseDTO } from '@hormigas/application'
import { getDB, initDatabase } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _service: MovimientoSyncService | null = null
let _initPromise: Promise<MovimientoSyncService> | null = null

export const getMovimientoService = (): Promise<MovimientoSyncService> => {
  if (_service) return Promise.resolve(_service)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    await initDatabase()
    const db = await getDB()
    const dbClient = new ExpoSQLiteClient(db)
    const tokenService = new TokenServiceImpl(storage)
    const http = new ApiHttpClient(API_URL, tokenService)

    const syncQueueRepo = new SqliteSyncQueueRepositoryImpl(dbClient)
    const inventarioRepo = new SqliteInventaryForSaleImpl(dbClient)

    const api: IMovimientoApi = {
      crear: (dto: Omit<CrearMovimientoDTO, 'inventarioId'>) =>
        http.post<MovimientoDTO>('/api/movimiento/crear', dto),
      listar: (sucursalId?: number, page = 0, size = 20) => {
        const params = new URLSearchParams({ page: String(page), size: String(size) })
        if (sucursalId != null) params.set('sucursalId', String(sucursalId))
        return http.get<MovimientoPage>(`/api/movimiento/buscar?${params}`)
      },
      stockBajo: () =>
        http.get<InventarioResponseDTO[]>('/api/inventario/stockBajo'),
      inventarioPorSucursal: (sucursalId: number) =>
        http.get<InventarioResponseDTO[]>(`/api/inventario/porSucursal?sucursalId=${sucursalId}`),
      buscarPorProducto: (productoId: number, sucursalId?: number, size = 500) => {
        const params = new URLSearchParams({ productoId: String(productoId), page: '0', size: String(size) })
        if (sucursalId != null) params.set('sucursalId', String(sucursalId))
        return http.get<MovimientoPage>(`/api/movimiento/buscar?${params}`)
      },
    }

    _service = createMovimientoService(syncQueueRepo, inventarioRepo, api)
    return _service
  })()

  return _initPromise
}
