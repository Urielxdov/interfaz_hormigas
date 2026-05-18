import { ValorInventarioDTO } from '../use-cases/reporte/reporte.dto'

export interface IApiReporteRepository {
  valorInventario(sucursalId: number): Promise<ValorInventarioDTO>
}
