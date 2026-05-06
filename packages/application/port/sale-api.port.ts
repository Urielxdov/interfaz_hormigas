export interface VentaBatchRequest {
    items: { productoId: number; cantidad: number }[]
    referencia: string
}

export interface ProductoConStockResponse {
    id: number
    inventarioId: number | null
    nombre: string
    sku: string
    precio: number
    stockActual: number
}

export interface IApiSaleRepository {
    registrarVentaBatch(request: VentaBatchRequest): Promise<void>
    buscarProductosConStock(q: string, sucursalId: number): Promise<ProductoConStockResponse[]>
}
