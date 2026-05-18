import { IApiMotivoRepository, MotivoDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiMotivoRepositoryImpl implements IApiMotivoRepository {
  constructor(private http: ApiHttpClient) {}

  async listar(): Promise<MotivoDTO[]> {
    return this.http.get<MotivoDTO[]>('/api/motivos-movimiento')
  }
}
