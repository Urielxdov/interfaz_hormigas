import { ILocalInventaryRepository } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'

type StockRow = {
    producto_local_id: string
    producto_server_id: number | null
    nombre: string
    sku: string
    precio: number
    stock_actual: number
}

export class SqliteInventaryForSaleImpl implements ILocalInventaryRepository {
    constructor(private db: DatabaseClient) {}

    async decrementStock(productoLocalId: string, sucursalServerId: number, cantidad: number): Promise<void> {
        await this.db.run(
            `UPDATE inventario
             SET stock_actual = stock_actual - ?
             WHERE producto_id = (SELECT server_id FROM producto WHERE local_id = ?)
               AND sucursal_id = ?`,
            [cantidad, productoLocalId, sucursalServerId]
        )
    }

    async searchWithStock(q: string, sucursalServerId: number): Promise<{
        productoLocalId: string
        productoServerId: number | null
        nombre: string
        sku: string
        precio: number
        stockActual: number
    }[]> {
        const pattern = `%${q}%`
        const rows = await this.db.getMany<StockRow>(
            `SELECT
               p.local_id   AS producto_local_id,
               p.server_id  AS producto_server_id,
               p.nombre,
               p.sku,
               p.precio,
               COALESCE(i.stock_actual, 0) AS stock_actual
             FROM producto p
             LEFT JOIN inventario i
               ON i.producto_id = p.server_id AND i.sucursal_id = ?
             WHERE p.activo = 1
               AND (p.nombre LIKE ? OR p.sku LIKE ?)
             ORDER BY p.nombre ASC
             LIMIT 30`,
            [sucursalServerId, pattern, pattern]
        )
        return rows.map(r => ({
            productoLocalId: r.producto_local_id,
            productoServerId: r.producto_server_id,
            nombre: r.nombre,
            sku: r.sku,
            precio: r.precio,
            stockActual: r.stock_actual,
        }))
    }

    async upsertFromServer(inventarioId: number, productoServerId: number, sucursalServerId: number, stockActual: number): Promise<void> {
        await this.db.run(
            `INSERT OR REPLACE INTO inventario (id, producto_id, sucursal_id, stock_actual, stock_maximo)
             VALUES (?, ?, ?, ?, 9999)`,
            [inventarioId, productoServerId, sucursalServerId, stockActual]
        )
    }
}
