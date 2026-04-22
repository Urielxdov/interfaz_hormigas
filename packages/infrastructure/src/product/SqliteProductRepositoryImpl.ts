import { Product } from '@hormigas/domain'
import { IProductRepository } from '@hormigas/application'
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
