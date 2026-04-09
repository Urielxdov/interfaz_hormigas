/**
 * Definiciones de tablas, columnas y queries base
 */

import { Transaction } from "packages/domain/entities/transaction/Transaction"

export const INVENTORY_MOVEMENTS_TABLE = 'movimiento'

export const INVENTORY_MOVEMENTS_COLUMNS = {
    id: 'id',
    inventary: 'inventario_id',
    user: 'usuario_id',
    typeTransaction: 'tipo_movimiento',
    quantity: 'cantidad',
    previousAmount: 'stock_anterior',
    newAmount: 'stock_nuevo',
    reference: 'referencia',
    date: 'fecha',
    synchronized: 'sincronizado'
}

export const INVENTORY_MOVEMENTS_QUERYS = {
    findById: () => `
        SELECT *
        FROM ${INVENTORY_MOVEMENTS_TABLE}
        WHERE ${INVENTORY_MOVEMENTS_COLUMNS.id} = ?
    `,

    findAll: () => `
        SELECT *
        FROM ${INVENTORY_MOVEMENTS_TABLE}
    `,

    existId: () => `
        SELECT EXISTS (
            SELECT 1
            FROM ${INVENTORY_MOVEMENTS_TABLE}
            WHERE ${INVENTORY_MOVEMENTS_COLUMNS.id} = ?
        ) AS exist
    `,

    save: () => `
        INSERT INTO ${INVENTORY_MOVEMENTS_TABLE} (
            ${INVENTORY_MOVEMENTS_COLUMNS.id},
            ${INVENTORY_MOVEMENTS_COLUMNS.inventary},
            ${INVENTORY_MOVEMENTS_COLUMNS.user},
            ${INVENTORY_MOVEMENTS_COLUMNS.typeTransaction},
            ${INVENTORY_MOVEMENTS_COLUMNS.quantity},
            ${INVENTORY_MOVEMENTS_COLUMNS.previousAmount},
            ${INVENTORY_MOVEMENTS_COLUMNS.newAmount},
            ${INVENTORY_MOVEMENTS_COLUMNS.reference},
            ${INVENTORY_MOVEMENTS_COLUMNS.date},
            ${INVENTORY_MOVEMENTS_COLUMNS.synchronized}
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
}