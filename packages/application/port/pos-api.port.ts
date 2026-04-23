export interface SucursalDTO {
  id: number
  nombre: string
  direccion?: string
  activa: boolean
}

export interface POSProductDTO {
  inventarioId: number
  productoId: number
  nombre: string
  sku?: string
  precio?: number
  stockActual: number
}

export interface CrearMovimientoDTO {
  sucursalId: number
  productoId: number
  tipoMovimiento: 'VENTA'
  cantidad: number
  referencia?: string
}

export interface IApiPOSRepository {
  getSucursales(): Promise<SucursalDTO[]>
  getInventarioPorSucursal(sucursalId: number): Promise<POSProductDTO[]>
  crearMovimiento(dto: CrearMovimientoDTO): Promise<void>
}

export interface ISqlitePOSCacheRepository {
  replaceProducts(sucursalId: number, products: POSProductDTO[]): Promise<void>
  getProducts(sucursalId: number): Promise<POSProductDTO[]>
  updateStock(productoId: number, sucursalId: number, newStock: number): Promise<void>
}

export interface CartItem {
  productoId: number
  nombre: string
  precio: number
  cantidad: number
}
