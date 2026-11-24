import { SaleService, ILocalInventaryRepository, SaleTxScope, SaleServiceOptions } from '../services/sale.service'
import { ISaleRepository } from '../repositories/sale.repository'
import { IUnitOfWork } from '../repositories/unit-of-work'
import { ISyncQueueRepository } from '../sync/sync.interfaces'
import { IApiSaleRepository } from '../port/sale-api.port'

export function createSaleService(
    saleRepo: ISaleRepository,
    inventaryRepo: ILocalInventaryRepository,
    syncQueueRepo: ISyncQueueRepository,
    apiSaleRepo: IApiSaleRepository,
    unitOfWork: IUnitOfWork<SaleTxScope>,
    options?: SaleServiceOptions
): SaleService {
    return new SaleService(saleRepo, inventaryRepo, syncQueueRepo, apiSaleRepo, unitOfWork, options)
}
