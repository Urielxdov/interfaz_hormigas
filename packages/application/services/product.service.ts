import { Product } from '@hormigas/domain'
import { IProductRepository } from '../repositories/product.repository'
import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { IApiProductRepository, NuevoProductoDTO } from '../port/product-api.port'
import { CreateProductDTO } from '../use-cases/product/Product.dto'
import { generateUUID } from '../utils/uuid'

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
        }

        await this.localRepo.save(product, false)

        const queueItem: SyncQueueItem = {
            id: generateUUID(),
            entity: 'producto',
            entityId: product.localId,
            operation: 'CREATE',
            payload: JSON.stringify({
                nombre: dto.nombre,
                sku: dto.sku,
                descripcion: dto.descripcion,
                precio: dto.precio,
            } satisfies NuevoProductoDTO),
            status: 'PENDING',
            retries: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        await this.syncQueueRepo.save(queueItem)

        return product
    }

    async update(product: Product): Promise<void> {
        await this.localRepo.save(product, false)
    }

    async toggleActive(localId: string): Promise<void> {
        const product = await this.localRepo.findById(localId)
        if (!product) return
        await this.localRepo.save({ ...product, activo: !product.activo }, false)
    }

    async syncPending(): Promise<void> {
        const pending = await this.syncQueueRepo.findPending(20)

        for (const item of pending) {
            try {
                if (item.entity !== 'producto') continue

                const payload = JSON.parse(item.payload) as NuevoProductoDTO

                if (item.operation === 'CREATE') {
                    const serverProduct = await this.apiRepo.create(payload)
                    await this.localRepo.markAsSynced(item.entityId, serverProduct.id)
                }

                await this.syncQueueRepo.markAsProcessed(item.id)
            } catch (e) {
                await this.syncQueueRepo.incrementRetries(item.id)
                console.warn(`[ProductService] sync falló para ${item.entityId}:`, e)
            }
        }
    }

    async pullFromServer(): Promise<void> {
        const serverProducts = await this.apiRepo.findAll()

        for (const sp of serverProducts) {
            const product: Product = {
                localId: generateUUID(),
                nombre: sp.nombre,
                sku: sp.sku,
                descripcion: sp.descripcion,
                precio: sp.precio,
                activo: sp.activo,
                categoria: sp.categoria,
                categoriaId: sp.id,
            }
            const existing = await this.localRepo.findBySku(sp.sku)
            if (existing) {
                await this.localRepo.markAsSynced(existing.localId, sp.id)
            } else {
                await this.localRepo.save(product, true)
            }
        }
    }
}
