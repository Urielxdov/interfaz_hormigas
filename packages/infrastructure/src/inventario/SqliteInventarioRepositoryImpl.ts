import { ISqliteInventarioRepository, InventarioItemDTO } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'

type InventarioRow = {
  id: number
  producto_id: number
  producto_nombre: string
  sucursal_id: number
  sucursal_nombre: string
  precio: number | null
  stock_actual: number
  stock_minimo: number
  stock_maximo: number
  synced_at: number
}

function toDTO(row: InventarioRow): InventarioItemDTO {
  return {
    id: row.id,
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    sucursalId: row.sucursal_id,
    sucursalNombre: row.sucursal_nombre,
    precio: row.precio ?? undefined,
    stockActual: row.stock_actual,
    stockMinimo: row.stock_minimo,
    stockMaximo: row.stock_maximo,
  }
}

export class SqliteInventarioRepositoryImpl implements ISqliteInventarioRepository {
  constructor(private db: DatabaseClient) {}

  async findBySucursal(sucursalId: number): Promise<InventarioItemDTO[]> {
    const rows = await this.db.getMany<InventarioRow>(
      'SELECT * FROM inventario WHERE sucursal_id = ? ORDER BY producto_nombre ASC',
      [sucursalId]
    )
    return rows.map(toDTO)
  }

  async findLowStock(): Promise<InventarioItemDTO[]> {
    const rows = await this.db.getMany<InventarioRow>(
      'SELECT * FROM inventario WHERE stock_actual < stock_minimo ORDER BY stock_actual ASC'
    )
    return rows.map(toDTO)
  }

  async upsertMany(items: InventarioItemDTO[]): Promise<void> {
    const now = Date.now()
    for (const item of items) {
      await this.db.run(
        `INSERT OR REPLACE INTO inventario
         (id, producto_id, producto_nombre, sucursal_id, sucursal_nombre,
          precio, stock_actual, stock_minimo, stock_maximo, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.productoId,
          item.productoNombre,
          item.sucursalId,
          item.sucursalNombre,
          item.precio ?? null,
          item.stockActual,
          item.stockMinimo,
          item.stockMaximo,
          now,
        ]
      )
    }
  }
}
