import { IApiEmpresaRepository, CreateEmpresaDTO, EmpresaResponseDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiEmpresaRepositoryImpl implements IApiEmpresaRepository {
    constructor(private http: ApiHttpClient) {}

    async listarTodas(): Promise<EmpresaResponseDTO[]> {
        return this.http.get<EmpresaResponseDTO[]>('/api/empresa/all')
    }

    async crear(dto: CreateEmpresaDTO): Promise<EmpresaResponseDTO> {
        return this.http.post<EmpresaResponseDTO>('/api/empresa/create', dto)
    }

    async activar(id: number): Promise<void> {
        await this.http.patch(`/api/empresa/${id}/activate`)
    }

    async desactivar(id: number): Promise<void> {
        await this.http.delete(`/api/empresa/delete/${id}`)
    }
}
