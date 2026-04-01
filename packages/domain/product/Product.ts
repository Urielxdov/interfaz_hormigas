// Nuestra entidad base
export interface Product {
    id: string
  nombre: string
  sku: string
  categoria: string
  precio: number
  activo: boolean
  control: boolean
  stockMinimo?: number
  stockMaximo?: number
}