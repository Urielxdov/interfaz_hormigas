import { Product } from "packages/domain/entities/product/Product";

export interface ProductRepository {
    findAll(): Promise<Product[]>
    findById(id: string): Promise<Product | null>
    save(product: Product): Promise<boolean>
}