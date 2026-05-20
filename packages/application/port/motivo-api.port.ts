import { MotivoDTO } from '../use-cases/motivo/motivo.dto'

export interface IApiMotivoRepository {
  listar(): Promise<MotivoDTO[]>
}
