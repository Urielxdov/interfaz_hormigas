import { Branch } from '@hormigas/domain'

export type BranchRow = {
  local_id: string
  server_id?: number
  nombre: string
  direccion?: string
  responsable?: string
  codigo?: string
  telefono?: string
  ciudad?: string
  activa: number
  synced: number
}

export class BranchSqliteMapper {
  static toDomain(row: BranchRow): Branch {
    return {
      localId: row.local_id,
      nombre: row.nombre,
      direccion: row.direccion ?? undefined,
      responsable: row.responsable ?? undefined,
      codigo: row.codigo ?? undefined,
      telefono: row.telefono ?? undefined,
      ciudad: row.ciudad ?? undefined,
      activa: row.activa === 1,
    }
  }

  static toRow(branch: Branch, synced = 0): BranchRow {
    return {
      local_id: branch.localId,
      nombre: branch.nombre,
      direccion: branch.direccion,
      responsable: branch.responsable,
      codigo: branch.codigo,
      telefono: branch.telefono,
      ciudad: branch.ciudad,
      activa: branch.activa ? 1 : 0,
      synced,
    }
  }
}
