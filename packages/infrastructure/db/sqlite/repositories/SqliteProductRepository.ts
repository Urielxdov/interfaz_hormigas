import { Product } from "packages/domain/entities/product/Product"

import { SqliteRepository } from "./SqliteRepository"

export interface SqliteProductRepository extends SqliteRepository<Product> {
    findBySku(sku: string): Promise<Product | null>
    findActive(): Promise<Product[]>
}
