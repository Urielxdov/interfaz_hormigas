export interface CategoriaDTO {
  id: number
  nombre: string
  descripcion?: string
  activo: boolean
}

export interface NuevaCategoriaDTO {
  nombre: string
  descripcion?: string
}

export interface IApiCategoriaRepository {
  listar(): Promise<CategoriaDTO[]>
  crear(dto: NuevaCategoriaDTO): Promise<CategoriaDTO>
  toggleActivo(id: number): Promise<CategoriaDTO>
}
