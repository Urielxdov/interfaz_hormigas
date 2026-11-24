import {
    SaleService,
    InsufficientStockError,
    MAX_SYNC_RETRIES,
    ILocalInventaryRepository,
    SaleTxScope,
} from '../sale.service'
import { NetworkError } from '../../errors/NetworkError'
import { ISaleRepository } from '../../repositories/sale.repository'
import { IUnitOfWork } from '../../repositories/unit-of-work'
import { FindPendingOptions, ISyncQueueRepository, SyncQueueItem } from '../../sync/sync.interfaces'
import { IApiSaleRepository, VentaBatchRequest, VentaBatchResponse } from '../../port/sale-api.port'
import type { Sale } from '@hormigas/domain'

// ---------- fakes en memoria ----------

class FakeUnitOfWork implements IUnitOfWork<SaleTxScope> {
    constructor(private stores: { snapshot(): unknown; restore(s: unknown): void }[]) {}
    async run<T>(fn: (scope?: SaleTxScope) => Promise<T>): Promise<T> {
        const snaps = this.stores.map(s => s.snapshot())
        try {
            return await fn()
        } catch (e) {
            this.stores.forEach((s, i) => s.restore(snaps[i]))
            throw e
        }
    }
}

class FakeInventory implements ILocalInventaryRepository {
    stock = new Map<string, number>()
    products: unknown[] = []
    upserts: unknown[][] = []
    snapshot() { return new Map(this.stock) }
    restore(s: unknown) { this.stock = new Map(s as Map<string, number>) }
    async decrementStock(productoLocalId: string, _s: number, cantidad: number) {
        const cur = this.stock.get(productoLocalId) ?? 0
        if (cur < cantidad) return false
        this.stock.set(productoLocalId, cur - cantidad)
        return true
    }
    async hasInventory(productoLocalId: string) { return this.stock.has(productoLocalId) }
    async searchWithStock() { return [] }
    async upsertProductFromServer(p: unknown) { this.products.push(p) }
    async upsertFromServer(...args: unknown[]) { this.upserts.push(args) }
    deactivated: number[][] = []
    async deactivateProductsNotIn(ids: number[]) { this.deactivated.push(ids) }
}

class FakeSales implements ISaleRepository {
    sales = new Map<string, Sale>()
    snapshot() { return new Map(this.sales) }
    restore(s: unknown) { this.sales = new Map(s as Map<string, Sale>) }
    async save(sale: Sale) { this.sales.set(sale.localId, { ...sale }) }
    async findAll() { return [...this.sales.values()] }
    async findByDate() { return [] }
    async findById(id: string) { return this.sales.get(id) ?? null }
    async markSynced(id: string) {
        const s = this.sales.get(id)
        if (s) s.sincronizado = true
    }
}

class FakeQueue implements ISyncQueueRepository {
    items = new Map<string, SyncQueueItem>()
    snapshot() { return new Map([...this.items].map(([k, v]) => [k, { ...v }])) }
    restore(s: unknown) { this.items = new Map(s as Map<string, SyncQueueItem>) }
    async save(i: SyncQueueItem) { this.items.set(i.id, { ...i }); return true }
    async findPending(limit = 20, o: FindPendingOptions = {}) {
        const now = o.now ?? new Date().toISOString()
        return [...this.items.values()]
            .filter(i => i.status === 'PENDING')
            .filter(i => !i.nextRetryAt || i.nextRetryAt <= now)
            .filter(i => !o.entity || i.entity === o.entity)
            .filter(i => !o.ownerId || !i.ownerId || i.ownerId === o.ownerId)
            .slice(0, limit)
            .map(i => ({ ...i }))
    }
    async scheduleRetry(id: string, at: string) {
        const it = this.items.get(id)!
        it.retries++
        it.nextRetryAt = at
        return true
    }
    async countByStatus() {
        const all = [...this.items.values()]
        return { pending: all.filter(i => i.status === 'PENDING').length, failed: all.filter(i => i.status === 'FAILED').length }
    }
    async retryFailed() {
        let n = 0
        for (const it of this.items.values()) {
            if (it.status === 'FAILED') { it.status = 'PENDING'; it.retries = 0; it.nextRetryAt = null; n++ }
        }
        return n
    }
    async findByEntity() { return [] }
    async markAsProcessed(id: string) { this.items.get(id)!.status = 'DONE'; return true }
    async markAsFailed(id: string) { this.items.get(id)!.status = 'FAILED'; return true }
    async incrementRetries(id: string) { this.items.get(id)!.retries++; return true }
    async clearProcessed() { return true }
}

class FakeApi implements IApiSaleRepository {
    calls: VentaBatchRequest[] = []
    behavior: (req: VentaBatchRequest) => Promise<VentaBatchResponse> = async req => ({
        clientId: req.clientId, duplicada: false, rechazados: [],
    })
    products: { id: number; inventarioId: number | null; nombre: string; sku: string; precio: number; stockActual: number }[] = []
    async registrarVentaBatch(req: VentaBatchRequest) { this.calls.push(req); return this.behavior(req) }
    async buscarProductosConStock() { return this.products }
}

const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status })

function setup() {
    const inventory = new FakeInventory()
    const sales = new FakeSales()
    const queue = new FakeQueue()
    const api = new FakeApi()
    const uow = new FakeUnitOfWork([inventory, sales, queue])
    const clock = { t: Date.parse('2026-01-01T12:00:00.000Z') }
    const svc = new SaleService(sales, inventory, queue, api, uow, { now: () => clock.t })
    inventory.stock.set('cola-local', 10)
    inventory.stock.set('papas-local', 1)
    /** Avanza el reloj mas alla del backoff maximo. */
    const advance = (ms = 11 * 60_000) => { clock.t += ms }
    return { svc, inventory, sales, queue, api, clock, advance }
}

const cola = { productoLocalId: 'cola-local', productoServerId: 11, nombre: 'Cola', sku: 'C1', precio: 20, cantidad: 2, subtotal: 40 }
const papas = { productoLocalId: 'papas-local', productoServerId: 12, nombre: 'Papas', sku: 'P1', precio: 15, cantidad: 3, subtotal: 45 }

let warn: jest.SpyInstance
beforeEach(() => { warn = jest.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => warn.mockRestore())

// ---------- registerSale ----------

describe('registerSale', () => {
    it('guarda venta, descuenta stock y encola la sincronizacion con sucursalId, clientId y fecha', async () => {
        const { svc, inventory, sales, queue } = setup()
        const sale = await svc.registerSale({ items: [cola], sucursalServerId: 7, montoRecibido: 50 })

        expect(inventory.stock.get('cola-local')).toBe(8)
        expect(sales.sales.has(sale.localId)).toBe(true)
        expect(sale.cambio).toBe(10)

        const [queued] = [...queue.items.values()]
        expect(queued.status).toBe('PENDING')
        expect(queued.entityId).toBe(sale.localId)
        const payload = JSON.parse(queued.payload)
        expect(payload).toEqual({
            clientId: sale.localId,
            sucursalId: 7,
            referencia: sale.localId,
            fecha: sale.fecha,
            items: [{ productoId: 11, cantidad: 2, precioUnitario: 20 }],
        })
    })

    it('es atomica: si un producto no alcanza no se descuenta nada, ni se guarda venta ni cola', async () => {
        const { svc, inventory, sales, queue } = setup()

        await expect(
            svc.registerSale({ items: [cola, papas], sucursalServerId: 7, montoRecibido: 200 })
        ).rejects.toBeInstanceOf(InsufficientStockError)

        expect(inventory.stock.get('cola-local')).toBe(10) // revertido
        expect(inventory.stock.get('papas-local')).toBe(1)
        expect(sales.sales.size).toBe(0)
        expect(queue.items.size).toBe(0)
    })

    it('no encola items sin productoServerId', async () => {
        const { svc, inventory, queue } = setup()
        inventory.stock.set('local-only', 5)
        await svc.registerSale({
            items: [{ ...cola, productoLocalId: 'local-only', productoServerId: null }],
            sucursalServerId: 7,
            montoRecibido: 40,
        })
        expect(queue.items.size).toBe(0)
    })
})

// ---------- syncPending ----------

describe('syncPending', () => {
    async function withPendingSale() {
        const ctx = setup()
        const sale = await ctx.svc.registerSale({ items: [cola], sucursalServerId: 7, montoRecibido: 40 })
        return { ...ctx, sale }
    }

    it('envia la venta, la marca DONE y actualiza venta.sincronizado', async () => {
        const { svc, api, queue, sales, sale } = await withPendingSale()

        const res = await svc.syncPending()

        expect(res).toMatchObject({ synced: 1, failed: 0, interrupted: false })
        expect(api.calls).toHaveLength(1)
        expect(api.calls[0].clientId).toBe(sale.localId)
        expect([...queue.items.values()][0].status).toBe('DONE')
        expect(sales.sales.get(sale.localId)!.sincronizado).toBe(true)
    })

    it('sin red (error sin status) no consume reintentos y deja la venta PENDING', async () => {
        const { svc, api, queue } = await withPendingSale()
        api.behavior = async () => { throw new NetworkError('Network request failed') }

        const res = await svc.syncPending()

        expect(res.interrupted).toBe(true)
        const item = [...queue.items.values()][0]
        expect(item.status).toBe('PENDING')
        expect(item.retries).toBe(0)
    })

    it('401 detiene la sincronizacion sin consumir reintentos', async () => {
        const { svc, api, queue } = await withPendingSale()
        api.behavior = async () => { throw httpError(401) }

        const res = await svc.syncPending()

        expect(res.interrupted).toBe(true)
        expect([...queue.items.values()][0]).toMatchObject({ status: 'PENDING', retries: 0 })
    })

    it('error 500 incrementa reintentos y pasa a FAILED al llegar a MAX_SYNC_RETRIES', async () => {
        const { svc, api, queue, advance } = await withPendingSale()
        api.behavior = async () => { throw httpError(500) }

        for (let i = 0; i < MAX_SYNC_RETRIES - 1; i++) {
            await svc.syncPending()
            expect([...queue.items.values()][0].status).toBe('PENDING')
            advance()
        }
        const last = await svc.syncPending()

        const item = [...queue.items.values()][0]
        expect(item.retries).toBe(MAX_SYNC_RETRIES)
        expect(item.status).toBe('FAILED')
        expect(last.failed).toBe(1)

        // una vez FAILED ya no se vuelve a intentar
        const callsBefore = api.calls.length
        await svc.syncPending()
        expect(api.calls.length).toBe(callsBefore)
    })

    it('error 4xx permanente (400) pasa directo a FAILED', async () => {
        const { svc, api, queue } = await withPendingSale()
        api.behavior = async () => { throw httpError(400) }

        const res = await svc.syncPending()

        expect(res.failed).toBe(1)
        expect([...queue.items.values()][0].status).toBe('FAILED')
    })

    it('si el servidor rechaza items la venta queda FAILED para revision pero sincronizada', async () => {
        const { svc, api, queue, sales, sale } = await withPendingSale()
        api.behavior = async req => ({
            clientId: req.clientId,
            duplicada: false,
            rechazados: [{ productoId: 11, cantidad: 2, motivo: 'Stock insuficiente' }],
        })

        const res = await svc.syncPending()

        expect(res.failed).toBe(1)
        expect([...queue.items.values()][0].status).toBe('FAILED')
        expect(sales.sales.get(sale.localId)!.sincronizado).toBe(true)
    })

    it('una respuesta duplicada del servidor se trata como exito', async () => {
        const { svc, api, queue } = await withPendingSale()
        api.behavior = async req => ({ clientId: req.clientId, duplicada: true, rechazados: [] })

        const res = await svc.syncPending()

        expect(res.synced).toBe(1)
        expect([...queue.items.values()][0].status).toBe('DONE')
    })

    it('candado: llamadas simultaneas no envian la misma venta dos veces', async () => {
        const { svc, api } = await withPendingSale()
        let release!: () => void
        api.behavior = req => new Promise(resolve => {
            release = () => resolve({ clientId: req.clientId, duplicada: false, rechazados: [] })
        })

        const first = svc.syncPending()
        await Promise.resolve()
        await Promise.resolve()
        const second = await svc.syncPending()
        expect(second.skipped).toBe(true)

        // dejar que el primer envio llegue a la llamada de API y resolverlo
        await new Promise(r => setTimeout(r, 0))
        release()
        const firstRes = await first

        expect(api.calls).toHaveLength(1)
        expect(firstRes.synced).toBe(1)
    })

    it('el candado se libera aunque falle, y se puede volver a sincronizar', async () => {
        const { svc, api } = await withPendingSale()
        api.behavior = async () => { throw new NetworkError('offline') }
        await svc.syncPending()

        api.behavior = async req => ({ clientId: req.clientId, duplicada: false, rechazados: [] })
        const res = await svc.syncPending()

        expect(res.skipped).toBe(false)
        expect(res.synced).toBe(1)
    })
})

// ---------- pullProductsWithStock ----------

describe('pullProductsWithStock', () => {
    it('llena el catalogo local (producto) y el stock', async () => {
        const { svc, api, inventory } = setup()
        api.products = [
            { id: 11, inventarioId: 100, nombre: 'Cola', sku: 'C1', precio: 20, stockActual: 9 },
            { id: 12, inventarioId: null, nombre: 'Papas', sku: 'P1', precio: 15, stockActual: 0 },
        ]

        await svc.pullProductsWithStock(7)

        expect(inventory.products).toEqual([
            { serverId: 11, nombre: 'Cola', sku: 'C1', precio: 20 },
            { serverId: 12, nombre: 'Papas', sku: 'P1', precio: 15 },
        ])
        // solo el que tiene inventario genera upsert de stock
        expect(inventory.upserts).toEqual([[100, 11, 7, 9]])
    })
})
