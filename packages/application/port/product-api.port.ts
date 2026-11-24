export interface NuevoProductoDTO {
    nombre: string
    descripcion?: string
    sku: string
    precio?: number
    categoria?: string
    categoriaId?: number
}

/** Actualizacion parcial (PUT /api/producto/{id}): un campo ausente no se cambia. */
export interface ActualizarProductoDTO {
    nombre?: string
    descripcion?: string
    sku?: string
    precio?: number
    categoriaId?: number
    activo?: boolean
}

export interface ApiProductResponseDTO {
    id: number
    nombre: string
    descripcion?: string
    sku: string
    precio?: number
    categoria?: string
    categoriaId?: number | null
    stockTotal?: number | null
    activo: boolean
}

export interface IApiProductRepository {
    create(dto: NuevoProductoDTO): Promise<ApiProductResponseDTO>
    update(serverId: number, dto: ActualizarProductoDTO): Promise<ApiProductResponseDTO>
    /** Todo el catalogo de la empresa, activos e inactivos. */
    findAll(): Promise<ApiProductResponseDTO[]>
}
