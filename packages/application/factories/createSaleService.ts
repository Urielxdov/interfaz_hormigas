import { SaleService, ILocalInventaryRepository } from '../services/sale.service'
import { ISaleRepository } from '../repositories/sale.repository'
import { ISyncQueueRepository } from '../sync/sync.interfaces'
import { IApiSaleRepository } from '../port/sale-api.port'

export function createSaleService(
    saleRepo: ISaleRepository,
    inventaryRepo: ILocalInventaryRepository,
    syncQueueRepo: ISyncQueueRepository,
    apiSaleRepo: IApiSaleRepository
): SaleService {
    return new SaleService(saleRepo, inventaryRepo, syncQueueRepo, apiSaleRepo)
}
