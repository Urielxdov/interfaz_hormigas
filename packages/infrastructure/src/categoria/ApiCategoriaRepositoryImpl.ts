import { IApiCategoriaRepository, CategoriaDTO, NuevaCategoriaDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiCategoriaRepositoryImpl implements IApiCategoriaRepository {
    constructor(private http: ApiHttpClient) {}

    listar(todas = false): Promise<CategoriaDTO[]> {
        return this.http.get<CategoriaDTO[]>(todas ? '/api/categoria/?todas=true' : '/api/categoria/')
    }

    actualizar(id: number, dto: NuevaCategoriaDTO): Promise<CategoriaDTO> {
        return this.http.put<CategoriaDTO>(`/api/categoria/${id}`, dto)
    }

    crear(dto: NuevaCategoriaDTO): Promise<CategoriaDTO> {
        return this.http.post<CategoriaDTO>('/api/categoria/nueva', dto)
    }

    toggleActivo(id: number): Promise<CategoriaDTO> {
        return this.http.patch<CategoriaDTO>(`/api/categoria/${id}/toggle`)
    }
}
