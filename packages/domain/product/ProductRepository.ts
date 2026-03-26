import { Product } from "./Product";

export interface ProductRepository {
    getProducts(): Promise<Product[]>
    save(product:Product): Promise<void>
    findById(id: string): Promise<Product | null>
}