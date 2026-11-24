export interface CreateProductDTO {
  nombre: string
  sku: string
  descripcion?: string
  categoria: string
  categoriaId?: number
  precio: number
  estado: boolean
  control: boolean
  stockMinimo?: number
  stockMaximo?: number
}

export interface ProductListItemDTO {
  id: string  // localId UUID
  serverId?: number
  nombre: string
  sku: string
  categoria: string
  categoriaId?: number
  /** false mientras tenga cambios sin enviar al servidor */
  synced: boolean
  precio: number
  stock: number
  estado: boolean
}