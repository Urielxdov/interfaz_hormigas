/**
 * Conversion de entidad Product en registro para SQLite
 */

import { Product } from "packages/domain/entities/product/Product";

export type ProductRow = {
    id: string
    nombre: string
    sku: string
    descripcion?: string
    precio?: number
    activo: boolean
    categoriaId?: number
}

export class ProductSqliteMapper {
    static toDomain(row: ProductRow): Product {
        return {
            localId: row.id,
            nombre: row.nombre,
            sku: row.sku,
            descripcion: row.descripcion,
            precio: row.precio,
            activo: row.activo,
            categoriaId: row.categoriaId
        }
    }
}