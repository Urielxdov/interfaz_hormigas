import { Product } from '@hormigas/domain';

export interface ProductRepository {
    findAll(): Promise<Product[]>
    findById(id: string): Promise<Product | null>
    save(product: Product): Promise<boolean>
}