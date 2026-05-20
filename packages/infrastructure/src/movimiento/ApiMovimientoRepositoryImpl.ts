import { IApiMovimientoRepository, CreateMovimientoDTO, MovimientoFiltroDTO, MovimientoResponseDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiMovimientoRepositoryImpl implements IApiMovimientoRepository {
  constructor(private http: ApiHttpClient) {}

  async crear(dto: CreateMovimientoDTO): Promise<MovimientoResponseDTO> {
    return this.http.post<MovimientoResponseDTO>('/api/movimiento/crear', dto)
  }

  async buscar(filtros: MovimientoFiltroDTO): Promise<MovimientoResponseDTO[]> {
    const params = new URLSearchParams()
    if (filtros.sucursalId != null) params.set('sucursalId', String(filtros.sucursalId))
    if (filtros.productoId != null) params.set('productoId', String(filtros.productoId))
    if (filtros.inventarioId != null) params.set('inventarioId', String(filtros.inventarioId))
    if (filtros.tipo) params.set('tipo', filtros.tipo)
    if (filtros.fechaInicio) params.set('fechaInicio', filtros.fechaInicio)
    if (filtros.fechaFin) params.set('fechaFin', filtros.fechaFin)
    const qs = params.toString()
    return this.http.get<MovimientoResponseDTO[]>(
      `/api/movimiento/buscar${qs ? `?${qs}` : ''}`
    )
  }
}
