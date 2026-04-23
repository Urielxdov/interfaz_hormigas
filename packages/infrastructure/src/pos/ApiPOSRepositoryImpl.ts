import { IApiPOSRepository, SucursalDTO, POSProductDTO, CrearMovimientoDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

type InventarioResponseDTO = {
  id: number
  productoId: number
  productoNombre: string
  precio?: number
  sucursalId: number
  stockActual: number
  sku?: string
}

export class ApiPOSRepositoryImpl implements IApiPOSRepository {
  constructor(private http: ApiHttpClient) {}

  async getSucursales(): Promise<SucursalDTO[]> {
    return this.http.get<SucursalDTO[]>('/api/sucursal/listar')
  }

  async getInventarioPorSucursal(sucursalId: number): Promise<POSProductDTO[]> {
    const data = await this.http.get<InventarioResponseDTO[]>(
      `/api/inventario/porSucursal?sucursalId=${sucursalId}`
    )
    return data.map(item => ({
      inventarioId: item.id,
      productoId: item.productoId,
      nombre: item.productoNombre,
      sku: item.sku,
      precio: item.precio,
      stockActual: item.stockActual,
    }))
  }

  async crearMovimiento(dto: CrearMovimientoDTO): Promise<void> {
    await this.http.post('/api/movimiento/crear', dto)
  }
}
