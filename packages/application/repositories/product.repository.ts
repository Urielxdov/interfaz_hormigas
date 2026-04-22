import { Product } from '@hormigas/domain'

export interface IProductRepository {
    findAll(): Promise<Product[]>
    findActive(): Promise<Product[]>
    findById(localId: string): Promise<Product | null>
    findBySku(sku: string): Promise<Product | null>
    save(product: Product, synced?: boolean): Promise<boolean>
    markAsSynced(localId: string, serverId: number): Promise<boolean>
    deleteById(localId: string): Promise<boolean>
}
