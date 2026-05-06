export interface ProductWithStock {
    productoLocalId: string
    productoServerId: number | null
    nombre: string
    sku: string
    precio: number
    stockActual: number
}

export interface CartItem {
    productoLocalId: string
    productoServerId: number | null
    nombre: string
    sku: string
    precio: number
    cantidad: number
    subtotal: number
}

export interface RegisterSaleDTO {
    items: CartItem[]
    sucursalServerId: number
    montoRecibido: number
}
