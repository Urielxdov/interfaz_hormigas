import { Product } from '@hormigas/domain'

export type ProductWithStock = Product & { stockTotal: number }

export type LowStockItem = Product & {
  stockActual: number
  stockMinimo: number
  sucursalId: number
}

export interface IProductRepository {
    findAll(): Promise<Product[]>
    findAllWithStock(): Promise<ProductWithStock[]>
    findLowStock(): Promise<LowStockItem[]>
    findActive(): Promise<Product[]>
    findById(localId: string): Promise<Product | null>
    findBySku(sku: string): Promise<Product | null>
    save(product: Product, synced?: boolean): Promise<boolean>
    markAsSynced(localId: string, serverId: number): Promise<boolean>
    deleteById(localId: string): Promise<boolean>
}
