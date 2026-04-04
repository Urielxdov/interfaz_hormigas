export interface CreateBranchDTO {
  nombre: string
  direccion?: string
  activa: boolean
}

export interface BranchItemListDTO {
  id: bigint
  nombre: string
  direccion?: string
  responsable: string
  activa: boolean
}