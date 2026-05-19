export interface CreateBranchDTO {
  nombre: string
  direccion?: string
  activa: boolean
  encargadoId?: number
}

export interface BranchItemListDTO {
  id: bigint
  nombre: string
  direccion?: string
  responsable?: string
  encargadoId?: number
  activa: boolean
}
