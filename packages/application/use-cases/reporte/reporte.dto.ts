export interface ValorInventarioDetalleDTO {
  productoId: number
  nombre: string
  sku: string
  stockActual: number
  precio: number | null
  valorLinea: number
  sinPrecio: boolean
}

export interface ValorInventarioDTO {
  sucursalId: number
  nombreSucursal: string
  valorTotal: number
  productosConPrecio: number
  productosSinPrecio: number
  detalle: ValorInventarioDetalleDTO[]
}
