import {
  IApiInventarioRepository,
  InventarioItemDTO,
  CreateInventarioDTO,
} from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

type ServerInventarioDTO = {
  id: number
  productoId: number
  productoNombre: string
  precio: number | null
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

function toDTO(s: ServerInventarioDTO): InventarioItemDTO {
  return {
    id: s.id,
    productoId: s.productoId,
    productoNombre: s.productoNombre,
    precio: s.precio ?? undefined,
    sucursalId: s.sucursalId,
    sucursalNombre: s.sucursalNombre,
    stockActual: s.stockActual,
    stockMinimo: s.stockMinimo,
    stockMaximo: s.stockMaximo,
  }
}

export class ApiInventarioRepositoryImpl implements IApiInventarioRepository {
  constructor(private http: ApiHttpClient) {}

  async listarPorSucursal(sucursalId: number): Promise<InventarioItemDTO[]> {
    const rows = await this.http.get<ServerInventarioDTO[]>(
      `/api/inventario/porSucursal?sucursalId=${sucursalId}`
    )
    return rows.map(toDTO)
  }

  async crear(dto: CreateInventarioDTO): Promise<InventarioItemDTO> {
    const row = await this.http.post<ServerInventarioDTO>(
      '/api/inventario/crear',
      dto
    )
    return toDTO(row)
  }
}
