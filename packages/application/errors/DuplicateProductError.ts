import { Product } from '@hormigas/domain'

export class DuplicateProductError extends Error {
    constructor(
        public readonly field: 'nombre' | 'sku',
        public readonly existing: Product
    ) {
        super(`Ya existe un producto con este ${field}`)
        this.name = 'DuplicateProductError'
    }
}
