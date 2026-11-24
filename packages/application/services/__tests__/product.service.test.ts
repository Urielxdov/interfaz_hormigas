import { ProductService } from '../product.service'
import { IProductRepository } from '../../repositories/product.repository'
import { FindPendingOptions, ISyncQueueRepository, SyncQueueItem } from '../../sync/sync.interfaces'
import { ActualizarProductoDTO, ApiProductResponseDTO, IApiProductRepository, NuevoProductoDTO } from '../../port/product-api.port'
import { NetworkError } from '../../errors/NetworkError'
import type { Product } from '@hormigas/domain'

class FakeProducts implements IProductRepository {
    rows = new Map<string, Product>()
    async findAll() { return [...this.rows.values()] }
    async findActive() { return [...this.rows.values()].filter(p => p.activo) }
    async findById(id: string) { return this.rows.get(id) ?? null }
    async findBySku(sku: string) { return [...this.rows.values()].find(p => p.sku === sku) ?? null }
    async findByNombre(n: string) { return [...this.rows.values()].find(p => p.nombre.toLowerCase() === n.toLowerCase()) ?? null }
    async findByServerId(id: number) { return [...this.rows.values()].find(p => p.serverId === id) ?? null }
    async save(p: Product, synced = false) { this.rows.set(p.localId, { ...p, synced }); return true }
    async markAsSynced(localId: string, serverId: number) {
        const p = this.rows.get(localId)
        if (p) this.rows.set(localId, { ...p, serverId, synced: true })
        return true
    }
    async deleteById(id: string) { this.rows.delete(id); return true }
}

class FakeQueue implements ISyncQueueRepository {
    items = new Map<string, SyncQueueItem>()
    async save(i: SyncQueueItem) { this.items.set(i.id, { ...i }); return true }
    async findPending(limit = 20, o: FindPendingOptions = {}) {
        return [...this.items.values()]
            .filter(i => i.status === 'PENDING' && (!o.entity || i.entity === o.entity))
            .slice(0, limit)
            .map(i => ({ ...i }))
    }
    async findByEntity(entity: string, id: string) { return [...this.items.values()].filter(i => i.entity === entity && i.entityId === id) }
    async markAsProcessed(id: string) { this.items.get(id)!.status = 'PROCESSED' as SyncQueueItem['status']; return true }
    async markAsFailed(id: string) { this.items.get(id)!.status = 'FAILED'; return true }
    async incrementRetries(id: string) { this.items.get(id)!.retries++; return true }
    async scheduleRetry(id: string) { this.items.get(id)!.retries++; return true }
    async countByStatus() { return { pending: 0, failed: 0 } as never }
    async retryFailed() { return 0 }
    async clearProcessed() { return true }
    pending() { return [...this.items.values()].filter(i => i.status === 'PENDING') }
}

class HttpErr extends Error { constructor(public status: number, msg: string) { super(msg) } }

class FakeApi implements IApiProductRepository {
    server = new Map<number, ApiProductResponseDTO>()
    nextId = 100
    fail: unknown = null
    updates: [number, ActualizarProductoDTO][] = []
    async create(dto: NuevoProductoDTO) {
        if (this.fail) throw this.fail
        const p: ApiProductResponseDTO = { id: this.nextId++, nombre: dto.nombre, sku: dto.sku, precio: dto.precio, activo: true, categoriaId: dto.categoriaId, categoria: dto.categoria, stockTotal: 0 }
        this.server.set(p.id, p)
        return p
    }
    async update(id: number, dto: ActualizarProductoDTO) {
        if (this.fail) throw this.fail
        this.updates.push([id, dto])
        const p = { ...this.server.get(id)!, ...dto }
        this.server.set(id, p)
        return p
    }
    async findAll() { return [...this.server.values()] }
}

function setup() {
    const repo = new FakeProducts()
    const queue = new FakeQueue()
    const api = new FakeApi()
    return { repo, queue, api, svc: new ProductService(repo, queue, api) }
}

const nuevo = { nombre: 'Coca 600', sku: 'BEB-1', precio: 18.5, categoria: 'Bebidas', categoriaId: 7, estado: true, control: false }

describe('ProductService', () => {
    test('una edicion se envia al servidor (antes solo quedaba en el telefono)', async () => {
        const { repo, api, svc } = setup()
        const p = await svc.create(nuevo)
        await svc.syncPending()
        const local = (await repo.findById(p.localId))!
        expect(local.serverId).toBe(100)

        await svc.update({ ...local, precio: 20, nombre: 'Coca-Cola 600' })
        const res = await svc.syncPending()

        expect(res.synced).toBe(1)
        expect(api.updates).toEqual([[100, { nombre: 'Coca-Cola 600', precio: 20 }]])
        expect(api.server.get(100)!.precio).toBe(20)
    })

    test('desactivar se envia como activo=false', async () => {
        const { repo, api, svc } = setup()
        const p = await svc.create(nuevo)
        await svc.syncPending()
        await svc.toggleActive(p.localId)
        await svc.syncPending()
        expect(api.server.get(100)!.activo).toBe(false)
        expect((await repo.findById(p.localId))!.activo).toBe(false)
    })

    test('la edicion de un producto aun no creado en el servidor espera a su alta', async () => {
        const { repo, api, svc } = setup()
        api.fail = new NetworkError()
        const p = await svc.create(nuevo)
        await svc.update({ ...(await repo.findById(p.localId))!, precio: 25 })
        const offline = await svc.syncPending()
        expect(offline.interrupted).toBe(true)

        api.fail = null
        await svc.syncPending()
        expect(api.server.get(100)!.precio).toBe(25)
    })

    test('un rechazo del servidor se informa y el pull restaura el valor del servidor', async () => {
        const { repo, queue, api, svc } = setup()
        const p = await svc.create(nuevo)
        await svc.syncPending()
        await svc.update({ ...(await repo.findById(p.localId))!, sku: 'BEB-2' })

        api.fail = new HttpErr(409, 'El SKU ya existe en esta empresa')
        const res = await svc.syncPending()
        expect(res.failed).toEqual([{ localId: p.localId, operation: 'UPDATE', message: 'El SKU ya existe en esta empresa' }])
        expect(queue.pending()).toHaveLength(0)

        api.fail = null
        await svc.pullFromServer()
        expect((await repo.findById(p.localId))!.sku).toBe('BEB-1')
    })

    test('un alta rechazada no deja un producto fantasma', async () => {
        const { repo, api, svc } = setup()
        api.fail = new HttpErr(400, 'La categoría está inactiva')
        const p = await svc.create(nuevo)
        const res = await svc.syncPending()
        expect(res.failed[0]?.operation).toBe('CREATE')
        expect(await repo.findById(p.localId)).toBeNull()
    })

    test('el pull trae categoria y stock y no pisa cambios locales pendientes', async () => {
        const { repo, api, svc } = setup()
        const p = await svc.create(nuevo)
        await svc.syncPending()
        api.server.set(100, { ...api.server.get(100)!, stockTotal: 42, categoria: 'Refrescos', categoriaId: 8 })

        await svc.pullFromServer()
        let local = (await repo.findById(p.localId))!
        expect(local.stockTotal).toBe(42)
        expect(local.categoriaId).toBe(8)
        expect(local.serverId).toBe(100)

        await svc.update({ ...local, precio: 99 })
        await svc.pullFromServer() // el cambio sigue en cola: no se revierte
        local = (await repo.findById(p.localId))!
        expect(local.precio).toBe(99)
    })

    test('rechaza en local un SKU que ya usa otro producto', async () => {
        const { repo, svc } = setup()
        await svc.create(nuevo)
        const otro = await svc.create({ ...nuevo, nombre: 'Agua', sku: 'BEB-9' })
        await expect(svc.update({ ...(await repo.findById(otro.localId))!, sku: 'BEB-1' }))
            .rejects.toThrow()
    })
})
