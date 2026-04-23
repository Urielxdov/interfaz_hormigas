import { IApiBranchRepository, ApiBranchResponseDTO, NuevaSucursalDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiBranchRepositoryImpl implements IApiBranchRepository {
  constructor(private http: ApiHttpClient) {}

  async create(dto: NuevaSucursalDTO): Promise<ApiBranchResponseDTO> {
    return this.http.post<ApiBranchResponseDTO>('/api/sucursal/nuevo', dto)
  }

  async findAll(): Promise<ApiBranchResponseDTO[]> {
    return this.http.get<ApiBranchResponseDTO[]>('/api/sucursal/')
  }
}
