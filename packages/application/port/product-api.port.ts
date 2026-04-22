export interface NuevoProductoDTO {
    nombre: string
    descripcion?: string
    sku: string
    precio?: number
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
    findAll(page?: number, size?: number): Promise<ApiProductResponseDTO[]>
}
