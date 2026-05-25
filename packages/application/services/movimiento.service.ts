import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { generateUUID } from '../utils/uuid'

export interface CrearMovimientoDTO {
  sucursalId: number
  productoId: number
  tipoMovimiento: 'ENTRADA' | 'SALIDA'
  cantidad: number
  referencia?: string
  inventarioId?: number
}

export interface MovimientoDTO {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  tipoMovimiento: string
  cantidad: number
  usuarioNombre: string
  referencia?: string
  fecha: string
  stockAnterior?: number
  stockNuevo?: number
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

export interface MovimientoPage {
  content: MovimientoDTO[]
  totalPages: number
  totalElements: number
  number: number
}

export interface IMovimientoApi {
  crear(dto: Omit<CrearMovimientoDTO, 'inventarioId'>): Promise<MovimientoDTO>
  listar(sucursalId?: number, page?: number, size?: number): Promise<MovimientoPage>
  stockBajo(): Promise<InventarioResponseDTO[]>
  inventarioPorSucursal(sucursalId: number): Promise<InventarioResponseDTO[]>
  buscarPorProducto(productoId: number, sucursalId?: number): Promise<MovimientoDTO[]>
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
  ) { }

  async registrar(dto: CrearMovimientoDTO, isOnline: boolean): Promise<MovimientoDTO | null> {
    const apiDto = {
      sucursalId: dto.sucursalId,
      productoId: dto.productoId,
      tipoMovimiento: dto.tipoMovimiento,
      cantidad: dto.cantidad,
      referencia: dto.referencia,
    }

    console.log(apiDto)

    if (isOnline) {
      const result = await this.api.crear(apiDto)
      if (dto.inventarioId != null) {
        await this.inventarioRepo.applyMovement(dto.inventarioId, dto.tipoMovimiento, dto.cantidad)
      }
      return result
    }

    // Offline: update local stock and enqueue
    if (dto.inventarioId != null) {
      await this.inventarioRepo.applyMovement(dto.inventarioId, dto.tipoMovimiento, dto.cantidad)
    }

    const item: SyncQueueItem = {
      id: generateUUID(),
      entity: 'movimiento',
      entityId: generateUUID(),
      operation: 'CREATE',
      payload: JSON.stringify(apiDto),
      status: 'PENDING',
      retries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await this.syncQueueRepo.save(item)
    return null
  }

  async listar(sucursalId?: number, page = 0, size = 20): Promise<MovimientoPage> {
    return this.api.listar(sucursalId, page, size)
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
        const dto = JSON.parse(item.payload) as Omit<CrearMovimientoDTO, 'inventarioId'>
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

  async buscarPorProducto(productoId: number, sucursalId?: number): Promise<MovimientoDTO[]> {
    return this.api.buscarPorProducto(productoId, sucursalId)
  }
}
