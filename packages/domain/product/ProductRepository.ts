import { Product } from "@hormigas/domain/product/Product";

export interface ProductRepository {
    getProducts(): Promise<Product[]>
    save(product:Product): Promise<void>
    findById(id: string): Promise<Product | null>
}