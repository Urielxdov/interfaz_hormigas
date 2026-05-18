export interface InventarioItemDTO {
  id: number
  productoId: number
  productoNombre: string
  precio?: number
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

export interface CreateInventarioDTO {
  sucursalId: number
  productoId: number
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}
