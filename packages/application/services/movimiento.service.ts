import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { generateUUID } from '../utils/uuid'

export interface CrearMovimientoDTO {
  inventarioId: number
  tipoMovimiento: 'ENTRADA' | 'SALIDA'
  cantidad: number
  referencia?: string
}

export interface MovimientoDTO {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  tipoMovimiento: 'ENTRADA' | 'SALIDA'
  cantidad: number
  usuarioNombre: string
  referencia?: string
  fecha: string
}

export interface InventarioResponseDTO {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

export interface IMovimientoApi {
  crear(dto: CrearMovimientoDTO): Promise<MovimientoDTO>
  listar(sucursalId?: number): Promise<MovimientoDTO[]>
  stockBajo(): Promise<InventarioResponseDTO[]>
  inventarioPorSucursal(sucursalId: number): Promise<InventarioResponseDTO[]>
}

export interface IInventarioLocalRepo {
  upsertFromServer(
    inventarioId: number,
    productoServerId: number,
    sucursalServerId: number,
    stockActual: number,
    stockMinimo: number,
    stockMaximo: number
  ): Promise<void>
  applyMovement(inventarioId: number, tipo: 'ENTRADA' | 'SALIDA', cantidad: number): Promise<void>
  getSucursalIds(): Promise<number[]>
  getLowStockItems(): Promise<InventarioLocalRow[]>
}

export interface InventarioLocalRow {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

export class MovimientoSyncService {
  constructor(
    private syncQueueRepo: ISyncQueueRepository,
    private inventarioRepo: IInventarioLocalRepo,
    private api: IMovimientoApi
  ) {}

  async registrar(dto: CrearMovimientoDTO, isOnline: boolean): Promise<MovimientoDTO | null> {
    if (isOnline) {
      const result = await this.api.crear(dto)
      await this.inventarioRepo.applyMovement(dto.inventarioId, dto.tipoMovimiento, dto.cantidad)
      return result
    }

    // Offline: update local stock and enqueue
    await this.inventarioRepo.applyMovement(dto.inventarioId, dto.tipoMovimiento, dto.cantidad)

    const item: SyncQueueItem = {
      id: generateUUID(),
      entity: 'movimiento',
      entityId: generateUUID(),
      operation: 'CREATE',
      payload: JSON.stringify(dto),
      status: 'PENDING',
      retries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await this.syncQueueRepo.save(item)
    return null
  }

  async listar(sucursalId?: number): Promise<MovimientoDTO[]> {
    return this.api.listar(sucursalId)
  }

  async syncPending(): Promise<void> {
    const MAX_RETRIES = 5
    const pending = await this.syncQueueRepo.findPending(50)
    for (const item of pending) {
      if (item.entity !== 'movimiento') continue

      if (item.retries >= MAX_RETRIES) {
        await this.syncQueueRepo.markAsFailed(item.id)
        continue
      }

      try {
        const dto = JSON.parse(item.payload) as CrearMovimientoDTO
        await this.api.crear(dto)
        await this.syncQueueRepo.markAsProcessed(item.id)
      } catch {
        await this.syncQueueRepo.incrementRetries(item.id)
      }
    }
  }

  async pullFromServer(): Promise<void> {
    const sucursalIds = await this.inventarioRepo.getSucursalIds()
    for (const sucursalId of sucursalIds) {
      try {
        const items = await this.api.inventarioPorSucursal(sucursalId)
        for (const item of items) {
          await this.inventarioRepo.upsertFromServer(
            item.id, item.productoId, item.sucursalId,
            item.stockActual, item.stockMinimo, item.stockMaximo
          )
        }
      } catch {
        console.warn(`[MovimientoSyncService] pullFromServer falló para sucursal ${sucursalId}`)
      }
    }
  }

  async getLowStockItems(): Promise<InventarioLocalRow[]> {
    return this.inventarioRepo.getLowStockItems()
  }
}
