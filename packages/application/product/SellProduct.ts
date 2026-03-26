import { Product } from "../../domain/product/Product";
import { ProductRepository } from "../../domain/product/ProductRepository";

export class SellProduct {
    constructor(private repo: ProductRepository) {}

    async execute(productId: string, quantity: number) {
        const product: Product | null = await this.repo.findById(productId)
        if (!product) throw new Error("Producto no encontrado")

        product.reduceStock(quantity)

        await this.repo.save(product)
    }
}