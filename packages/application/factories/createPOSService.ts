import { IApiPOSRepository, ISqlitePOSCacheRepository } from '../port/pos-api.port'
import { ISyncQueueRepository } from '../sync/sync.interfaces'
import { POSService } from '../services/pos.service'

export const createPOSService = (
  apiRepo: IApiPOSRepository,
  cacheRepo: ISqlitePOSCacheRepository,
  syncQueueRepo: ISyncQueueRepository
): POSService => {
  return new POSService(apiRepo, cacheRepo, syncQueueRepo)
}
