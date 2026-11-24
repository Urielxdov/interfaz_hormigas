import { Product } from '@hormigas/domain'
import { IProductRepository } from '../repositories/product.repository'
import { DuplicateProductError } from '../errors/DuplicateProductError'
import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { ActualizarProductoDTO, ApiProductResponseDTO, IApiProductRepository, NuevoProductoDTO } from '../port/product-api.port'
import { CreateProductDTO } from '../use-cases/product/Product.dto'
import { generateUUID } from '../utils/uuid'

const MAX_RETRIES = 5

/** Cambio de producto que el servidor rechazo (SKU repetido, categoria inactiva...). */
export interface ProductSyncFailure {
    localId: string
    operation: string
    message: string
}

export interface ProductSyncResult {
    synced: number
    failed: ProductSyncFailure[]
    /** Sin red / servidor caido: lo pendiente se queda en cola. */
    interrupted: boolean
}

function httpStatus(e: unknown): number | null {
    const status = (e as { status?: unknown } | null)?.status
    return typeof status === 'number' ? status : null
}

function isNetworkError(e: unknown): boolean {
    return !!(e as { isNetworkError?: boolean } | null)?.isNetworkError
}

/** 4xx distinto de 401/403/408/409/429: el dato es invalido, reintentar no sirve. */
function isRejected(e: unknown): boolean {
    const s = httpStatus(e)
    return s !== null && s >= 400 && s < 500 && ![401, 403, 408, 429].includes(s)
}

export class ProductService {
    constructor(
        private localRepo: IProductRepository,
        private syncQueueRepo: ISyncQueueRepository,
        private apiRepo: IApiProductRepository
    ) {}

    async findAll(): Promise<Product[]> {
        return this.localRepo.findAll()
    }

    async findActive(): Promise<Product[]> {
        return this.localRepo.findActive()
    }

    async create(dto: CreateProductDTO): Promise<Product> {
        const product: Product = {
            localId: generateUUID(),
            nombre: dto.nombre,
            sku: dto.sku,
            descripcion: dto.descripcion,
            precio: dto.precio,
            activo: dto.estado,
            categoria: dto.categoria,
            categoriaId: dto.categoriaId,
            stockTotal: 0,
        }

        const existingBySku = await this.localRepo.findBySku(dto.sku)
        if (existingBySku) throw new DuplicateProductError('sku', existingBySku)

        const existingByNombre = await this.localRepo.findByNombre(dto.nombre)
        if (existingByNombre) throw new DuplicateProductError('nombre', existingByNombre)

        await this.localRepo.save(product, false)
        await this.enqueue(product.localId, 'CREATE', {
            nombre: dto.nombre,
            sku: dto.sku,
            descripcion: dto.descripcion,
            precio: dto.precio,
            categoria: dto.categoria,
            categoriaId: dto.categoriaId,
        } satisfies NuevoProductoDTO)

        return product
    }

    /**
     * Guarda el cambio en local y lo encola para el servidor (antes solo se guardaba en
     * el telefono y el siguiente pull lo revertia).
     */
    async update(product: Product): Promise<void> {
        const existing = await this.localRepo.findById(product.localId)
        if (!existing) return

        if (product.sku !== existing.sku) {
            const dup = await this.localRepo.findBySku(product.sku)
            if (dup && dup.localId !== product.localId) throw new DuplicateProductError('sku', dup)
        }
        if (product.nombre.toLowerCase() !== existing.nombre.toLowerCase()) {
            const dup = await this.localRepo.findByNombre(product.nombre)
            if (dup && dup.localId !== product.localId) throw new DuplicateProductError('nombre', dup)
        }

        const merged: Product = {
            ...existing,
            ...product,
            serverId: existing.serverId,
            stockTotal: existing.stockTotal,
        }
        await this.localRepo.save(merged, false)

        const changes: ActualizarProductoDTO = {}
        if (merged.nombre !== existing.nombre) changes.nombre = merged.nombre
        if (merged.sku !== existing.sku) changes.sku = merged.sku
        if (merged.descripcion !== existing.descripcion && merged.descripcion !== undefined) changes.descripcion = merged.descripcion
        if (merged.precio !== existing.precio && merged.precio !== undefined) changes.precio = merged.precio
        if (merged.categoriaId !== existing.categoriaId && merged.categoriaId !== undefined) changes.categoriaId = merged.categoriaId
        if (merged.activo !== existing.activo) changes.activo = merged.activo
        if (Object.keys(changes).length > 0) await this.enqueue(merged.localId, 'UPDATE', changes)
    }

    async toggleActive(localId: string): Promise<void> {
        const product = await this.localRepo.findById(localId)
        if (!product) return
        await this.localRepo.save({ ...product, activo: !product.activo }, false)
        await this.enqueue(localId, 'UPDATE', { activo: !product.activo } satisfies ActualizarProductoDTO)
    }

    private async enqueue(localId: string, operation: 'CREATE' | 'UPDATE', payload: object) {
        const now = new Date().toISOString()
        const item: SyncQueueItem = {
            id: generateUUID(),
            entity: 'producto',
            entityId: localId,
            operation,
            payload: JSON.stringify(payload),
            status: 'PENDING',
            retries: 0,
            createdAt: now,
            updatedAt: now,
        }
        await this.syncQueueRepo.save(item)
    }

    /**
     * Envia altas y cambios en orden. Un rechazo del servidor (4xx) marca el cambio como
     * fallido y se informa; sin red se interrumpe sin gastar intentos.
     */
    async syncPending(): Promise<ProductSyncResult> {
        const result: ProductSyncResult = { synced: 0, failed: [], interrupted: false }
        const pending = await this.syncQueueRepo.findPending(50, { entity: 'producto' })
        const blocked = new Set<string>() // productos con un paso anterior sin enviar

        for (const item of pending) {
            if (item.entity !== 'producto') continue
            if (blocked.has(item.entityId)) continue

            if (item.retries >= MAX_RETRIES) {
                await this.syncQueueRepo.markAsFailed(item.id)
                blocked.add(item.entityId)
                continue
            }

            try {
                if (item.operation === 'CREATE') {
                    const payload = JSON.parse(item.payload) as NuevoProductoDTO
                    const serverProduct = await this.apiRepo.create(payload)
                    await this.localRepo.markAsSynced(item.entityId, serverProduct.id)
                } else if (item.operation === 'UPDATE') {
                    const local = await this.localRepo.findById(item.entityId)
                    if (!local) {
                        await this.syncQueueRepo.markAsProcessed(item.id)
                        continue
                    }
                    if (!local.serverId) {
                        // Su alta aun no llega al servidor: esperar a la siguiente pasada
                        blocked.add(item.entityId)
                        continue
                    }
                    const payload = JSON.parse(item.payload) as ActualizarProductoDTO
                    await this.apiRepo.update(local.serverId, payload)
                    await this.localRepo.markAsSynced(item.entityId, local.serverId)
                }
                await this.syncQueueRepo.markAsProcessed(item.id)
                result.synced++
            } catch (e) {
                if (isNetworkError(e) || httpStatus(e) === 401 || httpStatus(e) === 403) {
                    result.interrupted = true
                    break
                }
                blocked.add(item.entityId)
                if (isRejected(e)) {
                    await this.syncQueueRepo.markAsFailed(item.id)
                    // Un alta rechazada no existe en el servidor: no dejar un producto fantasma
                    if (item.operation === 'CREATE') await this.localRepo.deleteById(item.entityId)
                    result.failed.push({
                        localId: item.entityId,
                        operation: item.operation,
                        message: e instanceof Error ? e.message : 'El servidor rechazó el cambio',
                    })
                } else {
                    await this.syncQueueRepo.incrementRetries(item.id)
                    console.warn(`[ProductService] sync falló para ${item.entityId}:`, e)
                }
            }
        }
        return result
    }

    /**
     * Baja el catalogo completo (activos e inactivos). Los productos con cambios locales sin
     * enviar no se sobrescriben; un producto cuyo cambio fue rechazado vuelve al valor del servidor.
     */
    async pullFromServer(): Promise<void> {
        const serverProducts = await this.apiRepo.findAll()
        const pendingIds = new Set(
            (await this.syncQueueRepo.findPending(500, { entity: 'producto' })).map(i => i.entityId)
        )

        for (const sp of serverProducts) {
            const existing = await this.localRepo.findByServerId(sp.id)
                          ?? await this.localRepo.findBySku(sp.sku)
            if (existing && pendingIds.has(existing.localId)) continue
            await this.localRepo.save(this.fromServer(sp, existing?.localId), true)
        }
    }

    private fromServer(sp: ApiProductResponseDTO, localId?: string): Product {
        return {
            localId: localId ?? generateUUID(),
            nombre: sp.nombre,
            sku: sp.sku,
            descripcion: sp.descripcion,
            precio: sp.precio,
            activo: sp.activo,
            categoria: sp.categoria,
            categoriaId: sp.categoriaId ?? undefined,
            serverId: sp.id,
            stockTotal: sp.stockTotal ?? undefined,
        }
    }
}
