import { IApiBranchRepository, ApiBranchResponseDTO, NuevaSucursalDTO, UpdateSucursalDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiBranchRepositoryImpl implements IApiBranchRepository {
  constructor(private http: ApiHttpClient) {}

  async create(dto: NuevaSucursalDTO): Promise<ApiBranchResponseDTO> {
    return this.http.post<ApiBranchResponseDTO>('/api/sucursal/nuevo', dto)
  }

  async update(serverId: number, dto: UpdateSucursalDTO): Promise<ApiBranchResponseDTO> {
    return this.http.put<ApiBranchResponseDTO>(`/api/sucursal/${serverId}`, dto)
  }

  async findAll(): Promise<ApiBranchResponseDTO[]> {
    return this.http.get<ApiBranchResponseDTO[]>('/api/sucursal/')
  }
}
