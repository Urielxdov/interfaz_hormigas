import { InventarioItemDTO, CreateInventarioDTO } from '../use-cases/inventario/inventario.dto'

export interface IApiInventarioRepository {
  listarPorSucursal(sucursalId: number): Promise<InventarioItemDTO[]>
  crear(dto: CreateInventarioDTO): Promise<InventarioItemDTO>
}

export interface ISqliteInventarioRepository {
  findBySucursal(sucursalId: number): Promise<InventarioItemDTO[]>
  findLowStock(): Promise<InventarioItemDTO[]>
  upsertMany(items: InventarioItemDTO[]): Promise<void>
}
