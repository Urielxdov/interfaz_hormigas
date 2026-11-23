import { Sale, SaleItem } from '@hormigas/domain'
import { ISaleRepository } from '../repositories/sale.repository'
import { IUnitOfWork } from '../repositories/unit-of-work'
import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { IApiSaleRepository, VentaBatchRequest } from '../port/sale-api.port'
import { ProductWithStock, RegisterSaleDTO } from '../use-cases/sale/sale.dto'
import { generateUUID } from '../utils/uuid'

/** Intentos fallidos (error del servidor) antes de dar una venta por FAILED. */
export const MAX_SYNC_RETRIES = 5

export interface ServerProductData {
    serverId: number
    nombre: string
    sku: string
    precio: number
}

export interface ILocalInventaryRepository {
    /**
     * Descuenta stock solo si alcanza (UPDATE condicional).
     * @returns false si no habia stock suficiente (no se modifica nada)
     */
    decrementStock(productoLocalId: string, sucursalServerId: number, cantidad: number): Promise<boolean>
    searchWithStock(q: string, sucursalServerId: number): Promise<{
        productoLocalId: string
        productoServerId: number | null
        nombre: string
        sku: string
        precio: number
        stockActual: number
    }[]>
    /** Crea o actualiza el producto en el catalogo local a partir del servidor. */
    upsertProductFromServer(product: ServerProductData): Promise<void>
    /**
     * Guarda el stock del servidor. Debe restar lo vendido localmente que aun no se sincronizo,
     * para que un pull no "resucite" stock de ventas pendientes.
     */
    upsertFromServer(inventarioId: number, productoServerId: number, sucursalServerId: number, stockActual: number, stockMinimo?: number, stockMaximo?: number): Promise<void>
}

export class InsufficientStockError extends Error {
    constructor(public productName: string) {
        super(`Stock insuficiente para "${productName}"`)
        this.name = 'InsufficientStockError'
    }
}

export interface SyncPendingResult {
    /** Ventas aceptadas por el servidor. */
    synced: number
    /** Ventas que quedaron en FAILED (error permanente, reintentos agotados o items rechazados). */
    failed: number
    /** true si se detuvo por falta de red o sesion (nada se marco como fallido). */
    interrupted: boolean
    /** true si ya habia una sincronizacion en curso. */
    skipped: boolean
}

function httpStatus(e: unknown): number | null {
    const status = (e as { status?: unknown } | null)?.status
    return typeof status === 'number' ? status : null
}

export class SaleService {
    private syncing = false

    constructor(
        private saleRepo: ISaleRepository,
        private inventaryRepo: ILocalInventaryRepository,
        private syncQueueRepo: ISyncQueueRepository,
        private apiSaleRepo: IApiSaleRepository,
        private unitOfWork: IUnitOfWork
    ) {}

    /**
     * Registra la venta de forma atomica: descuento de stock, venta y cola de sync
     * se guardan juntos o no se guarda nada.
     * @throws InsufficientStockError si algun producto no alcanza
     */
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

        const syncableItems = saleItems.filter(i => i.productoServerId != null)

        await this.unitOfWork.run(async () => {
            for (const item of saleItems) {
                const ok = await this.inventaryRepo.decrementStock(
                    item.productoLocalId,
                    dto.sucursalServerId,
                    item.cantidad
                )
                if (!ok) throw new InsufficientStockError(item.nombre)
            }

            await this.saleRepo.save(sale)

            if (syncableItems.length > 0) {
                const request: VentaBatchRequest = {
                    clientId: sale.localId,
                    sucursalId: dto.sucursalServerId,
                    referencia: sale.localId,
                    fecha: sale.fecha,
                    items: syncableItems.map(i => ({
                        productoId: i.productoServerId as number,
                        cantidad: i.cantidad,
                        precioUnitario: i.precio,
                    })),
                }
                const now = new Date().toISOString()
                const queueItem: SyncQueueItem = {
                    id: generateUUID(),
                    entity: 'venta',
                    entityId: sale.localId,
                    operation: 'CREATE',
                    payload: JSON.stringify(request),
                    status: 'PENDING',
                    retries: 0,
                    createdAt: now,
                    updatedAt: now,
                }
                await this.syncQueueRepo.save(queueItem)
            }
        })

        return sale
    }

    /**
     * Envia las ventas pendientes. Seguro de llamar desde varios sitios a la vez:
     * si ya hay una sincronizacion en curso devuelve `skipped`.
     *
     * - Sin red / 401 / 403: se detiene y NO consume reintentos (la venta sigue PENDING).
     * - Error 5xx / 408 / 429: cuenta un reintento; al llegar a MAX_SYNC_RETRIES pasa a FAILED.
     * - Otro 4xx: error permanente, pasa a FAILED sin reintentar.
     * - Si el servidor rechaza items (p. ej. sin stock) la venta queda FAILED para revision,
     *   pero se marca sincronizada porque lo aceptado ya esta en el servidor.
     */
    async syncPending(): Promise<SyncPendingResult> {
        const result: SyncPendingResult = { synced: 0, failed: 0, interrupted: false, skipped: false }
        if (this.syncing) {
            result.skipped = true
            return result
        }
        this.syncing = true
        try {
            const pending = await this.syncQueueRepo.findPending(20)
            for (const item of pending) {
                if (item.entity !== 'venta') continue
                try {
                    const payload = JSON.parse(item.payload) as VentaBatchRequest
                    const response = await this.apiSaleRepo.registrarVentaBatch(payload)
                    await this.saleRepo.markSynced(item.entityId)
                    if (response?.rechazados?.length) {
                        await this.syncQueueRepo.markAsFailed(item.id)
                        result.failed++
                        console.warn(`[SaleService] venta ${item.entityId} con items rechazados:`, response.rechazados)
                    } else {
                        await this.syncQueueRepo.markAsProcessed(item.id)
                        result.synced++
                    }
                } catch (e) {
                    const status = httpStatus(e)
                    if (status === null || status === 401 || status === 403) {
                        result.interrupted = true
                        break
                    }
                    await this.syncQueueRepo.incrementRetries(item.id)
                    const retryable = status >= 500 || status === 408 || status === 429
                    if (!retryable || item.retries + 1 >= MAX_SYNC_RETRIES) {
                        await this.syncQueueRepo.markAsFailed(item.id)
                        result.failed++
                    }
                    console.warn(`[SaleService] sync fallo para ${item.entityId} (HTTP ${status}):`, e)
                }
            }
        } finally {
            this.syncing = false
        }
        return result
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

    /** Baja el catalogo y el stock de la sucursal al dispositivo. */
    async pullProductsWithStock(sucursalServerId: number): Promise<void> {
        const serverItems = await this.apiSaleRepo.buscarProductosConStock('', sucursalServerId)
        for (const sp of serverItems) {
            await this.inventaryRepo.upsertProductFromServer({
                serverId: sp.id,
                nombre: sp.nombre,
                sku: sp.sku,
                precio: sp.precio,
            })
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
