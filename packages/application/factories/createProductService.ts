import { IProductRepository } from '../repositories/product.repository'
import { ISyncQueueRepository } from '../sync/sync.interfaces'
import { IApiProductRepository } from '../port/product-api.port'
import { ProductService } from '../services/product.service'

export const createProductService = (
    localRepo: IProductRepository,
    syncQueueRepo: ISyncQueueRepository,
    apiRepo: IApiProductRepository
): ProductService => {
    return new ProductService(localRepo, syncQueueRepo, apiRepo)
}
