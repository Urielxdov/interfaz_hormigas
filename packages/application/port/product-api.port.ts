export interface NuevoProductoDTO {
    nombre: string
    descripcion?: string
    sku: string
    precio?: number
    stockMinimo?: number
    stockMaximo?: number
    controlStock?: boolean
}

export interface UpdateProductoDTO {
    nombre?: string
    descripcion?: string
    sku?: string
    precio?: number
    activo?: boolean
    categoria?: string
}

export interface ApiProductResponseDTO {
    id: number
    nombre: string
    descripcion?: string
    sku: string
    precio?: number
    categoria?: string
    activo: boolean
}

export interface IApiProductRepository {
    create(dto: NuevoProductoDTO): Promise<ApiProductResponseDTO>
    update(serverId: number, dto: UpdateProductoDTO): Promise<ApiProductResponseDTO>
    findAll(page?: number, size?: number): Promise<ApiProductResponseDTO[]>
}
