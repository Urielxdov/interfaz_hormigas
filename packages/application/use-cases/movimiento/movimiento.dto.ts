export type TipoMovimiento =
  | 'COMPRA'
  | 'VENTA'
  | 'AJUSTE'
  | 'MERMA'
  | 'DEVOLUCION_CLIENTE'
  | 'DEVOLUCION_PROVEEDOR'

export interface AlertaStockDTO {
  tipo: 'STOCK_CRITICO' | 'STOCK_BAJO' | 'STOCK_EXCEDIDO'
  mensaje: string
}

export interface MovimientoResponseDTO {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  tipoMovimiento: TipoMovimiento
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  usuarioNombre: string
  referencia?: string
  fecha: string
  alerta: AlertaStockDTO | null
}

export interface CreateMovimientoDTO {
  sucursalId: number
  productoId: number
  tipoMovimiento: TipoMovimiento
  cantidad: number
  referencia?: string
  motivoId?: number
}

export interface MovimientoFiltroDTO {
  sucursalId?: number
  productoId?: number
  inventarioId?: number
  tipo?: TipoMovimiento
  fechaInicio?: string
  fechaFin?: string
}
