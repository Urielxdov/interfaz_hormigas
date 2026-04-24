import { ISqlitePOSCacheRepository, POSProductDTO } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'

type POSProductRow = {
  id: number
  sucursal_id: number
  nombre: string
  sku?: string
  precio?: number
  stock_actual: number
}

export class SqlitePOSCacheRepositoryImpl implements ISqlitePOSCacheRepository {
  constructor(private db: DatabaseClient) {}

  async replaceProducts(sucursalId: number, products: POSProductDTO[]): Promise<void> {
    // Upsert primero — si se interrumpe, el caché anterior sigue intacto
    for (const p of products) {
      await this.db.run(
        `INSERT OR REPLACE INTO pos_producto (id, sucursal_id, nombre, sku, precio, stock_actual)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.productoId, sucursalId, p.nombre, p.sku ?? null, p.precio ?? null, p.stockActual]
      )
    }
    // Eliminar solo los que ya no devuelve el servidor
    if (products.length > 0) {
      const placeholders = products.map(() => '?').join(', ')
      const ids = products.map(p => p.productoId)
      await this.db.run(
        `DELETE FROM pos_producto WHERE sucursal_id = ? AND id NOT IN (${placeholders})`,
        [sucursalId, ...ids]
      )
    } else {
      await this.db.run('DELETE FROM pos_producto WHERE sucursal_id = ?', [sucursalId])
    }
  }

  async getProducts(sucursalId: number): Promise<POSProductDTO[]> {
    const rows = await this.db.getMany<POSProductRow>(
      'SELECT * FROM pos_producto WHERE sucursal_id = ? ORDER BY nombre ASC',
      [sucursalId]
    )
    return rows.map(r => ({
      inventarioId: r.id,
      productoId: r.id,
      nombre: r.nombre,
      sku: r.sku ?? undefined,
      precio: r.precio ?? undefined,
      stockActual: r.stock_actual,
    }))
  }

  async updateStock(productoId: number, sucursalId: number, newStock: number): Promise<void> {
    await this.db.run(
      'UPDATE pos_producto SET stock_actual = ? WHERE id = ? AND sucursal_id = ?',
      [newStock, productoId, sucursalId]
    )
  }
}
