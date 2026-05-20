import { Sale, SaleItem } from '@hormigas/domain'
import { ISaleRepository } from '../repositories/sale.repository'
import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { IApiSaleRepository } from '../port/sale-api.port'
import { CartItem, ProductWithStock, RegisterSaleDTO } from '../use-cases/sale/sale.dto'
import { generateUUID } from '../utils/uuid'

export interface ILocalInventaryRepository {
    decrementStock(productoLocalId: string, sucursalServerId: number, cantidad: number): Promise<void>
    searchWithStock(q: string, sucursalServerId: number): Promise<{
        productoLocalId: string
        productoServerId: number | null
        nombre: string
        sku: string
        precio: number
        stockActual: number
    }[]>
    upsertFromServer(inventarioId: number, productoServerId: number, sucursalServerId: number, stockActual: number, stockMinimo?: number, stockMaximo?: number): Promise<void>
}

export class SaleService {
    constructor(
        private saleRepo: ISaleRepository,
        private inventaryRepo: ILocalInventaryRepository,
        private syncQueueRepo: ISyncQueueRepository,
        private apiSaleRepo: IApiSaleRepository
    ) {}

    async registerSale(dto: RegisterSaleDTO): Promise<Sale> {
        const saleItems: SaleItem[] = dto.items.map(item => ({
            productoLocalId: item.productoLocalId,
            productoServerId: item.productoServerId,
            nombre: item.nombre,
            sku: item.sku,
            precio: item.precio,
            cantidad: item.cantidad,
            subtotal: item.precio * item.cantidad,
        }))

        const total = saleItems.reduce((sum, i) => sum + i.subtotal, 0)
        const cambio = Math.max(0, dto.montoRecibido - total)

        const sale: Sale = {
            localId: generateUUID(),
            sucursalId: String(dto.sucursalServerId),
            items: saleItems,
            total,
            montoRecibido: dto.montoRecibido,
            cambio,
            fecha: new Date().toISOString(),
            sincronizado: false,
        }

        for (const item of saleItems) {
            await this.inventaryRepo.decrementStock(
                item.productoLocalId,
                dto.sucursalServerId,
                item.cantidad
            )
        }

        await this.saleRepo.save(sale)

        const syncableItems = saleItems
            .filter(i => i.productoServerId != null)
            .map(i => ({ productoId: i.productoServerId as number, cantidad: i.cantidad }))

        if (syncableItems.length > 0) {
            const queueItem: SyncQueueItem = {
                id: generateUUID(),
                entity: 'venta',
                entityId: sale.localId,
                operation: 'CREATE',
                payload: JSON.stringify({ items: syncableItems, referencia: sale.localId }),
                status: 'PENDING',
                retries: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            await this.syncQueueRepo.save(queueItem)
        }

        return sale
    }

    async syncPending(): Promise<void> {
        const pending = await this.syncQueueRepo.findPending(20)
        for (const item of pending) {
            if (item.entity !== 'venta') continue
            try {
                const payload = JSON.parse(item.payload)
                await this.apiSaleRepo.registrarVentaBatch(payload)
                await this.syncQueueRepo.markAsProcessed(item.id)
            } catch (e) {
                await this.syncQueueRepo.incrementRetries(item.id)
                console.warn(`[SaleService] sync falló para ${item.entityId}:`, e)
            }
        }
    }

    async searchProducts(q: string, sucursalServerId: number): Promise<ProductWithStock[]> {
        const rows = await this.inventaryRepo.searchWithStock(q, sucursalServerId)
        return rows.map(r => ({
            productoLocalId: r.productoLocalId,
            productoServerId: r.productoServerId,
            nombre: r.nombre,
            sku: r.sku,
            precio: r.precio,
            stockActual: r.stockActual,
        }))
    }

    async pullProductsWithStock(sucursalServerId: number): Promise<void> {
        const serverItems = await this.apiSaleRepo.buscarProductosConStock('', sucursalServerId)
        for (const sp of serverItems) {
            if (sp.inventarioId == null) continue
            await this.inventaryRepo.upsertFromServer(
                sp.inventarioId,
                sp.id,
                sucursalServerId,
                sp.stockActual
            )
        }
    }

    async getHistory(): Promise<Sale[]> {
        return this.saleRepo.findAll()
    }
}
