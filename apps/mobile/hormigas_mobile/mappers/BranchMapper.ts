import { BranchItemTableDTO } from "@/interfaces/Branch";
import { BranchItemListDTO } from "@hormigas/application";

export const BranchMapper = {
  toListTable(dto: BranchItemListDTO): BranchItemTableDTO {
    return {
      id: dto.id,
      serverId: dto.serverId,
      nombre: dto.nombre,
      responsable: dto.responsable,
      direccion: dto.direccion,
      activa: dto.activa,
      acciones: ''
    }
  }
}