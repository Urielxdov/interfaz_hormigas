import { ApiHttpClient, TokenServiceImpl } from '@hormigas/infrastructure'
import type { TipoMovimiento } from '@hormigas/application'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

export interface MovimientoDTO {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  tipoMovimiento: TipoMovimiento
  cantidad: number
  usuarioNombre: string
  referencia?: string
  fecha: string
}

export interface CrearMovimientoDTO {
  sucursalId: number
  inventarioId: number
  tipoMovimiento: TipoMovimiento
  cantidad: number
  referencia?: string
}

type MovimientoApi = {
  listar(sucursalId?: number): Promise<MovimientoDTO[]>
  crear(dto: CrearMovimientoDTO): Promise<MovimientoDTO>
}

let _api: MovimientoApi | null = null

export const getMovimientoApi = (): MovimientoApi => {
  if (_api) return _api
  const tokenService = new TokenServiceImpl(storage)
  const http = new ApiHttpClient(API_URL, tokenService)
  _api = {
    listar: (sucursalId?: number) => {
      const params = sucursalId != null ? `?sucursalId=${sucursalId}` : ''
      return http.get<MovimientoDTO[]>(`/api/movimiento/buscar${params}`)
    },
    crear: (dto: CrearMovimientoDTO) => http.post<MovimientoDTO>('/api/movimiento/crear', dto),
  }
  return _api
}
