export interface EmpresaResponseDTO {
    id: number
    nombre: string
    rfc: string
    direccion: string | null
    telefono: string | null
    activo: boolean
}

export interface CreateEmpresaDTO {
    empresa: {
        nombre: string
        rfc: string
        direccion: string
        telefono: string
    }
    admin: {
        nombre: string
        correo: string
        password: string
    }
}

export interface IApiEmpresaRepository {
    listarTodas(): Promise<EmpresaResponseDTO[]>
    crear(dto: CreateEmpresaDTO): Promise<EmpresaResponseDTO>
    activar(id: number): Promise<void>
    desactivar(id: number): Promise<void>
}
