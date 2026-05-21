import { ILocalInventaryRepository, IInventarioLocalRepo, InventarioLocalRow } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'

type StockRow = {
    producto_local_id: string
    producto_server_id: number | null
    nombre: string
    sku: string
    precio: number
    stock_actual: number
}

export class SqliteInventaryForSaleImpl implements ILocalInventaryRepository, IInventarioLocalRepo {
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

    async upsertFromServer(
        inventarioId: number,
        productoServerId: number,
        sucursalServerId: number,
        stockActual: number,
        stockMinimo: number = 0,
        stockMaximo: number = 9999
    ): Promise<void> {
        await this.db.run(
            `INSERT OR REPLACE INTO inventario (id, producto_id, sucursal_id, stock_actual, stock_minimo, stock_maximo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [inventarioId, productoServerId, sucursalServerId, stockActual, stockMinimo, stockMaximo]
        )
    }

    async applyMovement(
        inventarioId: number,
        tipo: 'ENTRADA' | 'SALIDA',
        cantidad: number
    ): Promise<void> {
        const delta = tipo === 'ENTRADA' ? cantidad : -cantidad
        await this.db.run(
            `UPDATE inventario
             SET stock_actual = MAX(0, stock_actual + ?)
             WHERE id = ?`,
            [delta, inventarioId]
        )
    }

    async getSucursalIds(): Promise<number[]> {
        const rows = await this.db.getMany<{ sucursal_id: number }>(
            `SELECT DISTINCT sucursal_id FROM inventario`
        )
        return rows.map(r => r.sucursal_id)
    }

    async getLowStockItems(): Promise<InventarioLocalRow[]> {
        const rows = await this.db.getMany<{
            id: number
            producto_id: number
            producto_nombre: string
            sucursal_id: number
            sucursal_nombre: string
            stock_actual: number
            stock_minimo: number
            stock_maximo: number
        }>(
            `SELECT i.id, i.producto_id,
                    COALESCE(p.nombre, 'Producto #' || i.producto_id) AS producto_nombre,
                    i.sucursal_id,
                    COALESCE(s.nombre, 'Sucursal #' || i.sucursal_id) AS sucursal_nombre,
                    i.stock_actual, i.stock_minimo, i.stock_maximo
             FROM inventario i
             LEFT JOIN producto p ON p.server_id = i.producto_id
             LEFT JOIN sucursal s ON s.id = i.sucursal_id
             WHERE i.stock_minimo IS NOT NULL AND i.stock_actual <= i.stock_minimo`
        )
        return rows.map(r => ({
            id: r.id,
            productoId: r.producto_id,
            productoNombre: r.producto_nombre,
            sucursalId: r.sucursal_id,
            sucursalNombre: r.sucursal_nombre,
            stockActual: r.stock_actual,
            stockMinimo: r.stock_minimo,
            stockMaximo: r.stock_maximo,
        }))
    }
}
