export interface UsuarioResponseDTO {
    id: number
    name: string
    correo: string
    empresaId: number
    sucursalId: number | null
    sucursalNombre?: string | null
    activo: boolean
    /** USER (cajero), ADMIN o SUPER_ADMIN */
    roles?: string[]
    ultimoAcceso?: string | null
}

export interface CreateUsuarioDTO {
    correo: string
    password: string
    nombre: string
    sucursalId?: number | null
}

/** Actualizacion parcial: un campo ausente no se cambia. */
export interface UpdateUsuarioDTO {
    nombre?: string
    correo?: string
    password?: string
    sucursalId?: number
}

export interface IApiUserRepository {
    listarUsuarios(): Promise<UsuarioResponseDTO[]>
    crearUsuario(dto: CreateUsuarioDTO): Promise<UsuarioResponseDTO>
    actualizarUsuario(id: number, dto: UpdateUsuarioDTO): Promise<UsuarioResponseDTO>
    toggleActivo(id: number): Promise<UsuarioResponseDTO>
}
