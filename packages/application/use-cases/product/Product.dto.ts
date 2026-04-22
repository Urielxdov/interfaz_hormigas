export interface CreateProductDTO {
  nombre: string
  sku: string
  categoria: string
  precio: number
  estado: boolean
  control: boolean
  stockMinimo?: number
  stockMaximo?: number
}

export interface ProductListItemDTO {
  id: string  // localId UUID
  nombre: string
  sku: string
  categoria: string
  precio: number
  stock: number
  estado: boolean
}