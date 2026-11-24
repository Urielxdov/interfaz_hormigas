import { Product } from '@hormigas/domain'

export type ProductRow = {
    local_id: string
    server_id?: number | null
    nombre: string
    sku: string
    descripcion?: string | null
    precio?: number | null
    activo: number    // 0 | 1
    categoria?: string | null
    categoria_id?: number | null
    stock_total?: number | null
    synced: number    // 0 | 1
}

export class ProductSqliteMapper {
    static toDomain(row: ProductRow): Product {
        return {
            localId: row.local_id,
            nombre: row.nombre,
            sku: row.sku,
            descripcion: row.descripcion ?? undefined,
            precio: row.precio ?? undefined,
            activo: row.activo === 1,
            categoria: row.categoria ?? undefined,
            categoriaId: row.categoria_id ?? undefined,
            serverId: row.server_id ?? undefined,
            stockTotal: row.stock_total ?? undefined,
            synced: row.synced === 1,
        }
    }

    static toRow(product: Product, synced = 0): ProductRow {
        return {
            local_id: product.localId,
            nombre: product.nombre,
            sku: product.sku,
            descripcion: product.descripcion,
            precio: product.precio,
            activo: product.activo ? 1 : 0,
            categoria: product.categoria,
            categoria_id: product.categoriaId,
            server_id: product.serverId,
            stock_total: product.stockTotal,
            synced,
        }
    }
}
