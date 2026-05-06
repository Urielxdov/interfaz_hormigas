export interface UsuarioResponseDTO {
    id: number
    name: string
    correo: string
    empresaId: number
    sucursalId: number | null
    activo: boolean
}

export interface CreateUsuarioDTO {
    correo: string
    password: string
    nombre: string
    sucursalId?: number | null
}

export interface IApiUserRepository {
    listarUsuarios(): Promise<UsuarioResponseDTO[]>
    crearUsuario(dto: CreateUsuarioDTO): Promise<UsuarioResponseDTO>
}
