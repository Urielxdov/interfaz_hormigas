/**
 * Conversion de entidad de dominio a fila de SQLite
 */

import { Transaction, TypeTransaction } from '@hormigas/domain'

export type InventoryMovement = {
    id: string // Generado por dispositivo
    inventarioId?: number
    usuarioId?: number
    tipoMovimiento: TypeTransaction
    cantidad: number
    stockAnterior: number
    stockNuevo: number
    referencia?: string
    fecha?: string
    sincronizado: boolean
}

export class InventoryMovementSqliteMapper {
    static toDomain(row: InventoryMovement): Transaction {
        return {
            localId: row.id,
            inventarioId: row.inventarioId,
            usuarioId: row.usuarioId,
            tipoMovimiento: row.tipoMovimiento,
            cantidad: row.cantidad,
            stockAnterior: row.stockAnterior,
            stockNuevo: row.stockNuevo,
            referencia: row.referencia,
            fecha: row.fecha,
            sincronizado: row.sincronizado
        }
    }
}