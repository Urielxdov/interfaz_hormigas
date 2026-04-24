export interface NuevaSucursalDTO {
  nombre: string
  direccion?: string
  responsable?: string
}

export interface UpdateSucursalDTO {
  nombre?: string
  direccion?: string
  responsable?: string
  codigo?: string
  telefono?: string
  ciudad?: string
  activa?: boolean
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
  update(serverId: number, dto: UpdateSucursalDTO): Promise<ApiBranchResponseDTO>
  findAll(): Promise<ApiBranchResponseDTO[]>
}
