export class Product {
    constructor(
        public id: string,
        public name: string,
        public stock: number
    ) {}

    reduceStock(quantity: number) {
        if (this.stock < quantity) {
            throw new Error("Stock insuficiente");
        }
        this.stock -= quantity
    }
}