import { IApiUserRepository, CreateUsuarioDTO, UpdateUsuarioDTO, UsuarioResponseDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiUserRepositoryImpl implements IApiUserRepository {
    constructor(private http: ApiHttpClient) {}

    async listarUsuarios(): Promise<UsuarioResponseDTO[]> {
        return this.http.get<UsuarioResponseDTO[]>('/api/usuario/list')
    }

    async crearUsuario(dto: CreateUsuarioDTO): Promise<UsuarioResponseDTO> {
        return this.http.post<UsuarioResponseDTO>('/api/usuario/create', dto)
    }

    async actualizarUsuario(id: number, dto: UpdateUsuarioDTO): Promise<UsuarioResponseDTO> {
        return this.http.put<UsuarioResponseDTO>(`/api/usuario/${id}`, dto)
    }

    async toggleActivo(id: number): Promise<UsuarioResponseDTO> {
        return this.http.patch<UsuarioResponseDTO>(`/api/usuario/${id}/toggle`)
    }
}
