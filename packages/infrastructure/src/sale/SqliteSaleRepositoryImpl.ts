import { Sale, SaleItem } from '@hormigas/domain'
import { ISaleRepository } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'
import { generateUUID } from '@hormigas/application'

type VentaRow = {
    id: string
    sucursal_id: string
    total: number
    monto_recibido: number
    cambio: number
    fecha: string
    sincronizado: number
}

type VentaItemRow = {
    id: string
    venta_id: string
    producto_local_id: string
    producto_server_id: number | null
    nombre: string
    sku: string
    precio: number
    cantidad: number
    subtotal: number
}

function rowsToSale(venta: VentaRow, items: VentaItemRow[]): Sale {
    return {
        localId: venta.id,
        sucursalId: venta.sucursal_id,
        total: venta.total,
        montoRecibido: venta.monto_recibido,
        cambio: venta.cambio,
        fecha: venta.fecha,
        sincronizado: venta.sincronizado === 1,
        items: items.map(i => ({
            productoLocalId: i.producto_local_id,
            productoServerId: i.producto_server_id,
            nombre: i.nombre,
            sku: i.sku,
            precio: i.precio,
            cantidad: i.cantidad,
            subtotal: i.subtotal,
        })),
    }
}

export class SqliteSaleRepositoryImpl implements ISaleRepository {
    constructor(private db: DatabaseClient) {}

    async save(sale: Sale): Promise<void> {
        await this.db.run(
            `INSERT OR REPLACE INTO venta (id, sucursal_id, total, monto_recibido, cambio, fecha, sincronizado)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [sale.localId, sale.sucursalId, sale.total, sale.montoRecibido, sale.cambio, sale.fecha, sale.sincronizado ? 1 : 0]
        )
        for (const item of sale.items) {
            await this.db.run(
                `INSERT OR REPLACE INTO venta_item (id, venta_id, producto_local_id, producto_server_id, nombre, sku, precio, cantidad, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [generateUUID(), sale.localId, item.productoLocalId, item.productoServerId ?? null, item.nombre, item.sku, item.precio, item.cantidad, item.subtotal]
            )
        }
    }

    async findAll(): Promise<Sale[]> {
        const ventas = await this.db.getMany<VentaRow>('SELECT * FROM venta ORDER BY fecha DESC')
        return this._attachItems(ventas)
    }

    async findByDate(fecha: string): Promise<Sale[]> {
        const ventas = await this.db.getMany<VentaRow>(
            "SELECT * FROM venta WHERE fecha LIKE ? ORDER BY fecha DESC",
            [`${fecha}%`]
        )
        return this._attachItems(ventas)
    }

    private async _attachItems(ventas: VentaRow[]): Promise<Sale[]> {
        const result: Sale[] = []
        for (const v of ventas) {
            const items = await this.db.getMany<VentaItemRow>(
                'SELECT * FROM venta_item WHERE venta_id = ?',
                [v.id]
            )
            result.push(rowsToSale(v, items))
        }
        return result
    }
}
