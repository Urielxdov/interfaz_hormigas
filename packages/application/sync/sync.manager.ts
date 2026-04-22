import { ISyncManager } from './sync.interfaces'
import { ProductService } from '../services/product.service'

export class SyncManager implements ISyncManager {
    constructor(private productService: ProductService) {}

    async syncPending(): Promise<void> {
        await this.productService.syncPending()
    }

    async pullFromServer(): Promise<void> {
        await this.productService.pullFromServer()
    }
}
