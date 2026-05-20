import { ISyncQueueRepository } from '../sync/sync.interfaces'
import { MovimientoSyncService, IMovimientoApi, IInventarioLocalRepo } from '../services/movimiento.service'

export const createMovimientoService = (
  syncQueueRepo: ISyncQueueRepository,
  inventarioRepo: IInventarioLocalRepo,
  api: IMovimientoApi
): MovimientoSyncService => {
  return new MovimientoSyncService(syncQueueRepo, inventarioRepo, api)
}
