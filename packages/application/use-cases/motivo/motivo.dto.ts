import { TipoMovimiento } from '../movimiento/movimiento.dto'

export interface MotivoDTO {
  id: number
  nombre: string
  descripcion?: string
  tipoMovimiento: TipoMovimiento
}
