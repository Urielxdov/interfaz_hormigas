import { BranchItemListDTO, CreateBranchDTO } from '../use-cases/branch/Branch'

export interface IApiBranchRepository {
  listar(): Promise<BranchItemListDTO[]>
  crear(dto: CreateBranchDTO): Promise<BranchItemListDTO>
}
