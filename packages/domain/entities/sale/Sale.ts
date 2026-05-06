export interface SaleItem {
    productoLocalId: string
    productoServerId: number | null
    nombre: string
    sku: string
    precio: number
    cantidad: number
    subtotal: number
}

export interface Sale {
    localId: string
    sucursalId: string
    items: SaleItem[]
    total: number
    montoRecibido: number
    cambio: number
    fecha: string
    sincronizado: boolean
}
