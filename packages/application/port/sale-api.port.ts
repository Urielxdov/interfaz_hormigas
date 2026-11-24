export interface VentaBatchItemRequest {
    productoId: number
    cantidad: number
    precioUnitario: number
}

export interface VentaBatchRequest {
    /** Id generado en el cliente; el servidor lo usa para no duplicar reintentos. */
    clientId: string
    sucursalId: number
    items: VentaBatchItemRequest[]
    referencia: string
    /** Momento real de la venta (ISO-8601), importante para ventas hechas offline. */
    fecha: string
}

export interface VentaBatchItemRechazado {
    productoId: number
    cantidad: number
    motivo: string
}

export interface VentaBatchResponse {
    clientId: string | null
    duplicada: boolean
    /** Movimientos registrados (o ya registrados antes, si es un reintento). */
    procesados?: unknown[]
    rechazados: VentaBatchItemRechazado[]
}

/** Motivo con el que el backend reporta un item que ya estaba registrado (reintento concurrente). */
export const MOTIVO_ITEM_YA_REGISTRADO = 'Item ya registrado'

export interface ProductoConStockResponse {
    id: number
    inventarioId: number | null
    nombre: string
    sku: string
    precio: number
    stockActual: number
}

export interface IApiSaleRepository {
    registrarVentaBatch(request: VentaBatchRequest): Promise<VentaBatchResponse>
    buscarProductosConStock(q: string, sucursalId: number): Promise<ProductoConStockResponse[]>
}
