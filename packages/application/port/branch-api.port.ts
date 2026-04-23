export interface NuevaSucursalDTO {
  nombre: string
  direccion?: string
  responsable?: string
}

export interface ApiBranchResponseDTO {
  id: number
  nombre: string
  direccion?: string
  responsable?: string
  activa: boolean
}

export interface IApiBranchRepository {
  create(dto: NuevaSucursalDTO): Promise<ApiBranchResponseDTO>
  findAll(): Promise<ApiBranchResponseDTO[]>
}
