import { ApiHttpClient, SqliteSyncQueueRepositoryImpl, SqliteInventaryForSaleImpl, TokenServiceImpl } from '@hormigas/infrastructure'
import { createMovimientoService, MovimientoSyncService, IMovimientoApi, MovimientoDTO, CrearMovimientoDTO, InventarioResponseDTO } from '@hormigas/application'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _service: MovimientoSyncService | null = null
let _initPromise: Promise<MovimientoSyncService> | null = null

export const getMovimientoService = (): Promise<MovimientoSyncService> => {
  if (_service) return Promise.resolve(_service)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const db = await getDB()
    const dbClient = new ExpoSQLiteClient(db)
    const tokenService = new TokenServiceImpl(storage)
    const http = new ApiHttpClient(API_URL, tokenService)

    const syncQueueRepo = new SqliteSyncQueueRepositoryImpl(dbClient)
    const inventarioRepo = new SqliteInventaryForSaleImpl(dbClient)

    const api: IMovimientoApi = {
      crear: (dto: CrearMovimientoDTO) =>
        http.post<MovimientoDTO>('/api/movimiento/crear', dto),
      listar: (sucursalId?: number) => {
        const params = sucursalId != null ? `?sucursalId=${sucursalId}` : ''
        return http.get<MovimientoDTO[]>(`/api/movimiento/buscar${params}`)
      },
      stockBajo: () =>
        http.get<InventarioResponseDTO[]>('/api/inventario/stockBajo'),
      inventarioPorSucursal: (sucursalId: number) =>
        http.get<InventarioResponseDTO[]>(`/api/inventario/porSucursal?sucursalId=${sucursalId}`),
    }

    _service = createMovimientoService(syncQueueRepo, inventarioRepo, api)
    return _service
  })()

  return _initPromise
}
