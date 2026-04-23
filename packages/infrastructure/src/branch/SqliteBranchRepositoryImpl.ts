import { Branch } from '@hormigas/domain'
import { IBranchRepository } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'
import { BranchRow, BranchSqliteMapper } from '../../db/sqlite/mappers/BranchSqliteMapper'

export class SqliteBranchRepositoryImpl implements IBranchRepository {
  constructor(private db: DatabaseClient) {}

  async findAll(): Promise<Branch[]> {
    const rows = await this.db.getMany<BranchRow>(
      'SELECT * FROM sucursal ORDER BY nombre ASC'
    )
    return rows.map(BranchSqliteMapper.toDomain)
  }

  async findById(localId: string): Promise<Branch | null> {
    const row = await this.db.getOne<BranchRow>(
      'SELECT * FROM sucursal WHERE local_id = ?',
      [localId]
    )
    return row ? BranchSqliteMapper.toDomain(row) : null
  }

  async save(branch: Branch, synced = false): Promise<boolean> {
    const row = BranchSqliteMapper.toRow(branch, synced ? 1 : 0)
    await this.db.run(
      `INSERT OR REPLACE INTO sucursal
       (local_id, server_id, nombre, direccion, responsable, codigo, telefono, ciudad, activa, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.local_id,
        row.server_id ?? null,
        row.nombre,
        row.direccion ?? null,
        row.responsable ?? null,
        row.codigo ?? null,
        row.telefono ?? null,
        row.ciudad ?? null,
        row.activa,
        row.synced,
      ]
    )
    return true
  }

  async markAsSynced(localId: string, serverId: number): Promise<boolean> {
    await this.db.run(
      'UPDATE sucursal SET synced = 1, server_id = ? WHERE local_id = ?',
      [serverId, localId]
    )
    return true
  }

  async deleteById(localId: string): Promise<boolean> {
    await this.db.run('DELETE FROM sucursal WHERE local_id = ?', [localId])
    return true
  }
}
