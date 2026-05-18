import { IApiReporteRepository, ValorInventarioDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiReporteRepositoryImpl implements IApiReporteRepository {
  constructor(private http: ApiHttpClient) {}

  async valorInventario(sucursalId: number): Promise<ValorInventarioDTO> {
    return this.http.get<ValorInventarioDTO>(
      `/api/reportes/valor-inventario?sucursalId=${sucursalId}`
    )
  }
}
