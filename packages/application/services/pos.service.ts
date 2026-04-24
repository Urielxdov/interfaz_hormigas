import { IApiPOSRepository, ISqlitePOSCacheRepository, CartItem, POSProductDTO } from '../port/pos-api.port'
import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { generateUUID } from '../utils/uuid'

export class POSService {
  constructor(
    private apiRepo: IApiPOSRepository,
    private cacheRepo: ISqlitePOSCacheRepository,
    private syncQueueRepo: ISyncQueueRepository
  ) {}

  async getSucursales() {
    return this.apiRepo.getSucursales()
  }

  async syncProducts(sucursalId: number): Promise<void> {
    const products = await this.apiRepo.getInventarioPorSucursal(sucursalId)
    await this.cacheRepo.replaceProducts(sucursalId, products)
  }

  async getProducts(sucursalId: number): Promise<POSProductDTO[]> {
    return this.cacheRepo.getProducts(sucursalId)
  }

  async submitSale(items: CartItem[], sucursalId: number): Promise<void> {
    const saleRef = generateUUID()
    const products = await this.cacheRepo.getProducts(sucursalId)

    for (const item of items) {
      const product = products.find(p => p.productoId === item.productoId)
      const stockNuevo = Math.max(0, (product?.stockActual ?? 0) - item.cantidad)

      await this.cacheRepo.updateStock(item.productoId, sucursalId, stockNuevo)

      const queueItem: SyncQueueItem = {
        id: generateUUID(),
        entity: 'movimiento',
        entityId: generateUUID(),
        operation: 'CREATE',
        payload: JSON.stringify({
          sucursalId,
          productoId: item.productoId,
          tipoMovimiento: 'VENTA',
          cantidad: item.cantidad,
          referencia: saleRef,
        }),
        status: 'PENDING',
        retries: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await this.syncQueueRepo.save(queueItem)
    }
  }

  async syncPending(): Promise<void> {
    const pending = await this.syncQueueRepo.findPending(50)

    for (const item of pending) {
      if (item.entity !== 'movimiento') continue
      try {
        const payload = JSON.parse(item.payload)
        await this.apiRepo.crearMovimiento(payload)
        await this.syncQueueRepo.markAsProcessed(item.id)
      } catch (e) {
        await this.syncQueueRepo.incrementRetries(item.id)
        console.warn(`[POSService] sync falló para ${item.entityId}:`, e)
      }
    }
  }
}
