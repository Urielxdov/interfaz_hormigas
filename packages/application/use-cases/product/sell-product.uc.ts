import { Product } from '@hormigas/domain'
import { IProductRepository } from '../../repositories/product.repository'

export class SellProduct {
    constructor(private repo: IProductRepository) {}

    async execute(productId: string, quantity: number): Promise<void> {
        const product: Product | null = await this.repo.findById(productId)
        if (!product) throw new Error('Producto no encontrado')
        // la reducción de stock se maneja en inventario, no en el producto
        await this.repo.save(product)
    }
}
