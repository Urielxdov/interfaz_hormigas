import { Sale, SaleItem } from '@hormigas/domain'
import { ISaleRepository } from '../repositories/sale.repository'
import { IUnitOfWork } from '../repositories/unit-of-work'
import { ISyncQueueRepository, SyncQueueCounts, SyncQueueItem } from '../sync/sync.interfaces'
import {
    IApiSaleRepository,
    MOTIVO_ITEM_YA_REGISTRADO,
    VentaBatchItemRechazado,
    VentaBatchItemRequest,
    VentaBatchRequest,
    VentaBatchResponse,
} from '../port/sale-api.port'
import { ProductWithStock, RegisterSaleDTO } from '../use-cases/sale/sale.dto'
import { generateUUID } from '../utils/uuid'
import { InvalidResponseError, isInvalidResponseError, isNetworkError } from '../errors/NetworkError'

/** Intentos fallidos (error del servidor / datos) antes de dar una venta por FAILED. */
export const MAX_SYNC_RETRIES = 8
/** Primer reintento tras 15 s; se duplica en cada intento hasta 10 min. */
export const BASE_RETRY_DELAY_MS = 15_000
export const MAX_RETRY_DELAY_MS = 10 * 60_000

export const VENTA_ENTITY = 'venta'

/** Espera antes del intento `attempt` (1 = primer reintento). */
export function computeRetryDelayMs(
    attempt: number,
    base = BASE_RETRY_DELAY_MS,
    max = MAX_RETRY_DELAY_MS
): number {
    const exp = Math.max(0, attempt - 1)
    return Math.min(max, base * Math.pow(2, exp))
}

export interface ServerProductData {
    serverId: number
    nombre: string
    sku: string
    precio: number
}

export interface ILocalInventaryRepository {
    /**
     * Descuenta stock solo si alcanza (UPDATE condicional).
     * @returns false si no habia stock suficiente o no hay inventario (no se modifica nada)
     */
    decrementStock(productoLocalId: string, sucursalServerId: number, cantidad: number): Promise<boolean>
    /** true si el producto tiene registro de inventario en la sucursal (aunque sea con 0). */
    hasInventory(productoLocalId: string, sucursalServerId: number): Promise<boolean>
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
    /** Marca activo=0 los productos del servidor que ya no vienen en el catalogo (desactivados). */
    deactivateProductsNotIn(serverIds: number[]): Promise<void>
}

/** Repositorios ligados a una transaccion (ver IUnitOfWork). */
export interface SaleTxScope {
    saleRepo?: ISaleRepository
    inventaryRepo?: ILocalInventaryRepository
    syncQueueRepo?: ISyncQueueRepository
}

export class InsufficientStockError extends Error {
    constructor(public productName: string, message?: string) {
        super(message ?? `Stock insuficiente para "${productName}"`)
        this.name = 'InsufficientStockError'
    }
}

/** El producto no tiene inventario en la sucursal (distinto de "no alcanza"). */
export class NoInventoryError extends InsufficientStockError {
    constructor(productName: string) {
        super(productName, `"${productName}" no tiene inventario en esta sucursal`)
        this.name = 'NoInventoryError'
    }
}

export type SyncInterruptReason = 'network' | 'auth' | 'server' | 'invalid-response'

export interface SyncPendingResult {
    /** Ventas aceptadas por el servidor. */
    synced: number
    /** Ventas que quedaron en FAILED (error permanente, reintentos agotados o items rechazados). */
    failed: number
    /** true si se detuvo la pasada (red, sesion, servidor caido o respuesta invalida). */
    interrupted: boolean
    /** Por que se interrumpio. 'auth' = 401/403: la sesion debe renovarse. */
    reason?: SyncInterruptReason
    /** true si ya habia una sincronizacion en curso (no se hizo nada). */
    skipped: boolean
}

export interface SyncAndPullResult extends SyncPendingResult {
    /** true si ademas se bajo catalogo/stock. */
    pulled: boolean
}

export interface SyncOptions {
    /** Solo se envian ventas de este usuario (o heredadas sin usuario). */
    ownerId?: string | null
}

export interface SaleServiceOptions {
    now?: () => number
    maxRetries?: number
    baseRetryDelayMs?: number
    maxRetryDelayMs?: number
    batchSize?: number
}

function httpStatus(e: unknown): number | null {
    const status = (e as { status?: unknown } | null)?.status
    return typeof status === 'number' ? status : null
}

export type SyncErrorAction =
    /** No gastar intento; detener la pasada. */
    | { kind: 'interrupt'; reason: SyncInterruptReason }
    /** Gastar intento (backoff) y detener la pasada: el servidor no esta bien. */
    | { kind: 'retry-interrupt'; reason: SyncInterruptReason }
    /** Error permanente de los datos: FAILED. */
    | { kind: 'fail' }
    /** Error inesperado de este item: gastar intento y seguir con el siguiente. */
    | { kind: 'retry' }

/**
 * Clasificacion de errores al enviar una venta:
 * - NetworkError (sin red / timeout) o 401/403 -> interrumpir sin gastar intento.
 * - 5xx, 408, 429, 409 o 2xx invalido -> reintentable: gasta intento con backoff e interrumpe.
 * - Otros 4xx (400, 404, 422...) -> FAILED.
 * - Cualquier otro error (TypeError, JSON corrupto...) -> gasta intento, no bloquea la cola.
 */
export function classifySyncError(e: unknown): SyncErrorAction {
    if (isNetworkError(e)) return { kind: 'interrupt', reason: 'network' }
    if (isInvalidResponseError(e)) return { kind: 'retry-interrupt', reason: 'invalid-response' }
    const status = httpStatus(e)
    if (status === 401 || status === 403) return { kind: 'interrupt', reason: 'auth' }
    if (status !== null) {
        if (status >= 500 || status === 408 || status === 429 || status === 409) {
            return { kind: 'retry-interrupt', reason: 'server' }
        }
        if (status >= 400) return { kind: 'fail' }
    }
    return { kind: 'retry' }
}

function isValidVentaResponse(res: unknown, clientId: string): res is VentaBatchResponse {
    if (typeof res !== 'object' || res === null) return false
    const r = res as Partial<VentaBatchResponse>
    if (r.clientId !== clientId) return false
    if (!Array.isArray(r.rechazados)) return false
    if (r.procesados !== undefined && r.procesados !== null && !Array.isArray(r.procesados)) return false
    return true
}

function isValidItem(i: unknown): i is VentaBatchItemRequest {
    const it = i as Partial<VentaBatchItemRequest> | null
    return !!it
        && typeof it.productoId === 'number'
        && typeof it.cantidad === 'number' && it.cantidad > 0
        && typeof it.precioUnitario === 'number'
}

const EMPTY_RESULT = (): SyncPendingResult => ({ synced: 0, failed: 0, interrupted: false, skipped: false })

export class SaleService {
    private syncing = false
    private readonly now: () => number
    private readonly maxRetries: number
    private readonly baseRetryDelayMs: number
    private readonly maxRetryDelayMs: number
    private readonly batchSize: number

    constructor(
        private saleRepo: ISaleRepository,
        private inventaryRepo: ILocalInventaryRepository,
        private syncQueueRepo: ISyncQueueRepository,
        private apiSaleRepo: IApiSaleRepository,
        private unitOfWork: IUnitOfWork<SaleTxScope>,
        options: SaleServiceOptions = {}
    ) {
        this.now = options.now ?? (() => Date.now())
        this.maxRetries = options.maxRetries ?? MAX_SYNC_RETRIES
        this.baseRetryDelayMs = options.baseRetryDelayMs ?? BASE_RETRY_DELAY_MS
        this.maxRetryDelayMs = options.maxRetryDelayMs ?? MAX_RETRY_DELAY_MS
        this.batchSize = options.batchSize ?? 20
    }

    /**
     * Registra la venta de forma atomica: descuento de stock, venta y cola de sync
     * se guardan juntos o no se guarda nada.
     * @throws InsufficientStockError si algun producto no alcanza (NoInventoryError si no hay inventario)
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
            fecha: new Date(this.now()).toISOString(),
            sincronizado: false,
        }

        const syncableItems = saleItems.filter(i => i.productoServerId != null)

        await this.unitOfWork.run(async scope => {
            const inventaryRepo = scope?.inventaryRepo ?? this.inventaryRepo
            const saleRepo = scope?.saleRepo ?? this.saleRepo
            const syncQueueRepo = scope?.syncQueueRepo ?? this.syncQueueRepo

            for (const item of saleItems) {
                const ok = await inventaryRepo.decrementStock(
                    item.productoLocalId,
                    dto.sucursalServerId,
                    item.cantidad
                )
                if (!ok) {
                    const exists = await inventaryRepo.hasInventory(item.productoLocalId, dto.sucursalServerId)
                    throw exists ? new InsufficientStockError(item.nombre) : new NoInventoryError(item.nombre)
                }
            }

            await saleRepo.save(sale)

            if (syncableItems.length > 0) {
                const request: VentaBatchRequest = {
                    clientId: sale.localId,
                    sucursalId: dto.sucursalServerId,
                    referencia: sale.localId,
                    fecha: sale.fecha,
                    items: syncableItems.map(i => ({
                        productoId: i.productoServerId as number,
                        cantidad: i.cantidad,
                        // El backend acepta como maximo 2 decimales.
                        precioUnitario: Math.round(i.precio * 100) / 100,
                    })),
                }
                const now = new Date(this.now()).toISOString()
                const queueItem: SyncQueueItem = {
                    id: generateUUID(),
                    entity: VENTA_ENTITY,
                    entityId: sale.localId,
                    operation: 'CREATE',
                    payload: JSON.stringify(request),
                    status: 'PENDING',
                    retries: 0,
                    createdAt: now,
                    updatedAt: now,
                    nextRetryAt: null,
                    ownerId: dto.ownerId ?? null,
                }
                await syncQueueRepo.save(queueItem)
            }
        })

        return sale
    }

    /** Ejecuta `fn` con el candado de sincronizacion; null si ya habia una en curso. */
    private async runExclusive<T>(fn: () => Promise<T>): Promise<T | null> {
        if (this.syncing) return null
        this.syncing = true
        try {
            return await fn()
        } finally {
            this.syncing = false
        }
    }

    /**
     * Envia las ventas pendientes. Seguro de llamar desde varios sitios a la vez:
     * si ya hay una sincronizacion en curso devuelve `skipped`.
     * Ver classifySyncError para el manejo de errores.
     */
    async syncPending(options: SyncOptions = {}): Promise<SyncPendingResult> {
        const res = await this.runExclusive(() => this.syncPendingUnlocked(options))
        return res ?? { ...EMPTY_RESULT(), skipped: true }
    }

    /**
     * Envia pendientes y, si la pasada no se interrumpio, baja catalogo y stock;
     * todo bajo el mismo candado (el pull nunca corre en paralelo con un envio).
     */
    async syncAndPull(sucursalServerId: number, options: SyncOptions = {}): Promise<SyncAndPullResult> {
        const res = await this.runExclusive(async (): Promise<SyncAndPullResult> => {
            const sync = await this.syncPendingUnlocked(options)
            if (sync.interrupted) return { ...sync, pulled: false }
            await this.pullProductsWithStock(sucursalServerId)
            return { ...sync, pulled: true }
        })
        return res ?? { ...EMPTY_RESULT(), skipped: true, pulled: false }
    }

    private async syncPendingUnlocked(options: SyncOptions): Promise<SyncPendingResult> {
        const result = EMPTY_RESULT()
        const pending = await this.syncQueueRepo.findPending(this.batchSize, {
            entity: VENTA_ENTITY,
            ownerId: options.ownerId,
            now: new Date(this.now()).toISOString(),
        })

        for (const item of pending) {
            if (item.entity !== VENTA_ENTITY) continue

            let request: VentaBatchRequest
            try {
                request = await this.buildRequest(item)
            } catch (e) {
                console.warn(`[SaleService] payload invalido para ${item.entityId}:`, (e as Error)?.message ?? e)
                await this.spendAttempt(item, result)
                continue
            }

            let response: unknown
            try {
                response = await this.apiSaleRepo.registrarVentaBatch(request)
            } catch (e) {
                const action = classifySyncError(e)
                console.warn(
                    `[SaleService] sync fallo para ${item.entityId} (HTTP ${httpStatus(e) ?? '-'}):`,
                    (e as Error)?.message ?? e
                )
                if (action.kind === 'interrupt') {
                    result.interrupted = true
                    result.reason = action.reason
                    break
                }
                if (action.kind === 'retry-interrupt') {
                    await this.spendAttempt(item, result)
                    result.interrupted = true
                    result.reason = action.reason
                    break
                }
                if (action.kind === 'fail') {
                    await this.syncQueueRepo.markAsFailed(item.id)
                    result.failed++
                    continue
                }
                await this.spendAttempt(item, result)
                continue
            }

            if (!isValidVentaResponse(response, request.clientId)) {
                console.warn(`[SaleService] respuesta invalida del servidor para ${item.entityId}`)
                await this.spendAttempt(item, result)
                result.interrupted = true
                result.reason = 'invalid-response'
                break
            }

            // Un item "ya registrado" es un reintento de algo que el servidor ya tiene: cuenta como procesado.
            const rechazados = response.rechazados.filter(
                (r: VentaBatchItemRechazado) => r?.motivo !== MOTIVO_ITEM_YA_REGISTRADO
            )
            await this.unitOfWork.run(async scope => {
                const saleRepo = scope?.saleRepo ?? this.saleRepo
                const syncQueueRepo = scope?.syncQueueRepo ?? this.syncQueueRepo
                // Lo aceptado ya esta en el servidor: la venta queda sincronizada aunque haya rechazos.
                await saleRepo.markSynced(item.entityId)
                if (rechazados.length > 0) await syncQueueRepo.markAsFailed(item.id)
                else await syncQueueRepo.markAsProcessed(item.id)
            })
            if (rechazados.length > 0) {
                result.failed++
                console.warn(`[SaleService] venta ${item.entityId} con items rechazados:`, rechazados)
            } else {
                result.synced++
            }
        }
        return result
    }

    /** Cuenta un intento fallido; con reintentos agotados pasa a FAILED, si no programa backoff. */
    private async spendAttempt(item: SyncQueueItem, result: SyncPendingResult): Promise<void> {
        const attempt = item.retries + 1
        if (attempt >= this.maxRetries) {
            await this.syncQueueRepo.incrementRetries(item.id)
            await this.syncQueueRepo.markAsFailed(item.id)
            result.failed++
            return
        }
        const delay = computeRetryDelayMs(attempt, this.baseRetryDelayMs, this.maxRetryDelayMs)
        await this.syncQueueRepo.scheduleRetry(item.id, new Date(this.now() + delay).toISOString())
    }

    /**
     * Arma el request desde el payload. Payloads de versiones anteriores (sin clientId o
     * sucursalId) o corruptos se reconstruyen desde venta / venta_item.
     */
    private async buildRequest(item: SyncQueueItem): Promise<VentaBatchRequest> {
        let parsed: Partial<VentaBatchRequest> | null = null
        try {
            const p: unknown = JSON.parse(item.payload)
            parsed = typeof p === 'object' && p !== null ? (p as Partial<VentaBatchRequest>) : null
        } catch {
            parsed = null
        }

        const rawItems = parsed?.items
        const parsedItems = Array.isArray(rawItems) && rawItems.length > 0 && rawItems.every(isValidItem)
            ? rawItems
            : null

        if (
            parsed
            && typeof parsed.clientId === 'string' && parsed.clientId.trim() !== ''
            && typeof parsed.sucursalId === 'number' && parsed.sucursalId > 0
            && parsedItems
        ) {
            return {
                clientId: parsed.clientId,
                sucursalId: parsed.sucursalId,
                items: parsedItems,
                referencia: typeof parsed.referencia === 'string' ? parsed.referencia : parsed.clientId,
                fecha: typeof parsed.fecha === 'string' ? parsed.fecha : item.createdAt,
            }
        }

        const sale = await this.saleRepo.findById(item.entityId)
        if (!sale) throw new Error(`No se puede reconstruir la venta ${item.entityId}: no existe localmente`)
        const sucursalId = typeof parsed?.sucursalId === 'number' && parsed.sucursalId > 0
            ? parsed.sucursalId
            : Number(sale.sucursalId)
        if (!Number.isFinite(sucursalId) || sucursalId <= 0) {
            throw new Error(`Venta ${item.entityId} sin sucursal valida`)
        }
        const items = parsedItems ?? sale.items
            .filter((i: SaleItem) => i.productoServerId != null)
            .map((i: SaleItem) => ({ productoId: i.productoServerId as number, cantidad: i.cantidad, precioUnitario: i.precio }))
        if (items.length === 0) throw new Error(`Venta ${item.entityId} sin items sincronizables`)

        const request: VentaBatchRequest = {
            clientId: sale.localId,
            sucursalId,
            items,
            referencia: typeof parsed?.referencia === 'string' ? parsed.referencia : sale.localId,
            fecha: typeof parsed?.fecha === 'string' ? parsed.fecha : sale.fecha,
        }
        // Guardar el payload reparado para los siguientes intentos.
        await this.syncQueueRepo.save({ ...item, payload: JSON.stringify(request) })
        return request
    }

    /** FAILED -> PENDING para volver a intentar (accion manual del usuario). */
    async retryFailed(): Promise<number> {
        return this.syncQueueRepo.retryFailed(VENTA_ENTITY)
    }

    async getQueueCounts(): Promise<SyncQueueCounts> {
        return this.syncQueueRepo.countByStatus(VENTA_ENTITY)
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

    /**
     * Baja el catalogo y el stock de la sucursal al dispositivo. Los productos que ya no
     * vienen del servidor (desactivados) se marcan inactivos en local.
     * Preferir syncAndPull, que ademas evita correr en paralelo con un envio.
     */
    async pullProductsWithStock(sucursalServerId: number): Promise<void> {
        const serverItems = await this.apiSaleRepo.buscarProductosConStock('', sucursalServerId)
        if (!Array.isArray(serverItems)) {
            throw new InvalidResponseError('El catalogo del servidor no es una lista')
        }
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
        await this.inventaryRepo.deactivateProductsNotIn(serverItems.map(sp => sp.id))
    }

    async getHistory(): Promise<Sale[]> {
        return this.saleRepo.findAll()
    }
}
