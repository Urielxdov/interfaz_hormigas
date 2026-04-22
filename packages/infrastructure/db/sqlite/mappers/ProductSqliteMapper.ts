import { Product } from '@hormigas/domain'

export type ProductRow = {
    local_id: string
    server_id?: number
    nombre: string
    sku: string
    descripcion?: string
    precio?: number
    activo: number    // 0 | 1
    categoria?: string
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
            categoriaId: row.server_id ?? undefined,
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
            synced,
        }
    }
}
