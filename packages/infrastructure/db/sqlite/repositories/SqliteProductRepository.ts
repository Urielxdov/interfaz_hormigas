import { Product } from '@hormigas/domain'

import { SqliteRepository } from "./SqliteRepository"

export interface SqliteProductRepository extends SqliteRepository<Product> {
    findBySku(sku: string): Promise<Product | null>
    findActive(): Promise<Product[]>
}
