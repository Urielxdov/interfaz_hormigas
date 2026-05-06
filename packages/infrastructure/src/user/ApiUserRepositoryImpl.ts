import { IApiUserRepository, CreateUsuarioDTO, UsuarioResponseDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiUserRepositoryImpl implements IApiUserRepository {
    constructor(private http: ApiHttpClient) {}

    async listarUsuarios(): Promise<UsuarioResponseDTO[]> {
        return this.http.get<UsuarioResponseDTO[]>('/api/usuario/list')
    }

    async crearUsuario(dto: CreateUsuarioDTO): Promise<UsuarioResponseDTO> {
        return this.http.post<UsuarioResponseDTO>('/api/usuario/create', dto)
    }
}
