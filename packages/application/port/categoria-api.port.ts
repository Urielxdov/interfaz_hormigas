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
  /** Activas; con `todas` tambien las inactivas (pantalla de gestion). */
  listar(todas?: boolean): Promise<CategoriaDTO[]>
  crear(dto: NuevaCategoriaDTO): Promise<CategoriaDTO>
  actualizar(id: number, dto: NuevaCategoriaDTO): Promise<CategoriaDTO>
  toggleActivo(id: number): Promise<CategoriaDTO>
}
