import {
  CreateMovimientoDTO,
  MovimientoFiltroDTO,
  MovimientoResponseDTO,
} from '../use-cases/movimiento/movimiento.dto'

export interface IApiMovimientoRepository {
  crear(dto: CreateMovimientoDTO): Promise<MovimientoResponseDTO>
  buscar(filtros: MovimientoFiltroDTO): Promise<MovimientoResponseDTO[]>
}
