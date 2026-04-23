export interface CreateBranchDTO {
  nombre: string
  direccion?: string
  responsable?: string
  codigo?: string
  telefono?: string
  ciudad?: string
  activa?: boolean
}

export interface BranchItemListDTO {
  id: string
  nombre: string
  direccion?: string
  responsable?: string
  activa: boolean
}
