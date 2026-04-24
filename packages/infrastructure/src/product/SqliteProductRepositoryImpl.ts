import { Product } from '@hormigas/domain'
import { IProductRepository, ProductWithStock, LowStockItem } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'
import { ProductRow, ProductSqliteMapper } from '../../db/sqlite/mappers/ProductSqliteMapper'

export class SqliteProductRepositoryImpl implements IProductRepository {
    constructor(private db: DatabaseClient) {}

    async findAll(): Promise<Product[]> {
        const rows = await this.db.getMany<ProductRow>(
            'SELECT * FROM producto ORDER BY nombre ASC'
        )
        return rows.map(ProductSqliteMapper.toDomain)
    }

    async findActive(): Promise<Product[]> {
        const rows = await this.db.getMany<ProductRow>(
            'SELECT * FROM producto WHERE activo = 1 ORDER BY nombre ASC'
        )
        return rows.map(ProductSqliteMapper.toDomain)
    }

    async findById(localId: string): Promise<Product | null> {
        const row = await this.db.getOne<ProductRow>(
            'SELECT * FROM producto WHERE local_id = ?',
            [localId]
        )
        return row ? ProductSqliteMapper.toDomain(row) : null
    }

    async findBySku(sku: string): Promise<Product | null> {
        const row = await this.db.getOne<ProductRow>(
            'SELECT * FROM producto WHERE sku = ?',
            [sku]
        )
        return row ? ProductSqliteMapper.toDomain(row) : null
    }

    async findAllWithStock(): Promise<ProductWithStock[]> {
        const rows = await this.db.getMany<ProductRow & { stock_total: number }>(
            `SELECT p.*, COALESCE(SUM(i.stock_actual), 0) as stock_total
             FROM producto p
             LEFT JOIN inventario i ON p.server_id = i.producto_id
             GROUP BY p.local_id
             ORDER BY p.nombre ASC`
        )
        return rows.map(r => ({ ...ProductSqliteMapper.toDomain(r), stockTotal: r.stock_total }))
    }

    async findLowStock(): Promise<LowStockItem[]> {
        type LowRow = ProductRow & { stock_actual: number; stock_minimo: number; sucursal_id: number }
        const rows = await this.db.getMany<LowRow>(
            `SELECT p.*, i.stock_actual, i.stock_minimo, i.sucursal_id
             FROM inventario i
             JOIN producto p ON i.producto_id = p.server_id
             WHERE i.stock_minimo IS NOT NULL AND i.stock_actual < i.stock_minimo
             ORDER BY i.stock_actual ASC`
        )
        return rows.map(r => ({
            ...ProductSqliteMapper.toDomain(r),
            stockActual: r.stock_actual,
            stockMinimo: r.stock_minimo,
            sucursalId: r.sucursal_id,
        }))
    }

    async save(product: Product, synced = false): Promise<boolean> {
        const row = ProductSqliteMapper.toRow(product, synced ? 1 : 0)
        await this.db.run(
            `INSERT OR REPLACE INTO producto
             (local_id, server_id, nombre, sku, descripcion, precio, activo, categoria, synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                row.local_id,
                row.server_id ?? null,
                row.nombre,
                row.sku,
                row.descripcion ?? null,
                row.precio ?? null,
                row.activo,
                row.categoria ?? null,
                row.synced,
            ]
        )
        return true
    }

    async markAsSynced(localId: string, serverId: number): Promise<boolean> {
        await this.db.run(
            'UPDATE producto SET synced = 1, server_id = ? WHERE local_id = ?',
            [serverId, localId]
        )
        return true
    }

    async deleteById(localId: string): Promise<boolean> {
        await this.db.run(
            'DELETE FROM producto WHERE local_id = ?',
            [localId]
        )
        return true
    }
}
