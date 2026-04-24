import { Branch } from '@hormigas/domain'
import { IBranchRepository } from '../repositories/branch.repository'
import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { IApiBranchRepository, NuevaSucursalDTO, UpdateSucursalDTO } from '../port/branch-api.port'
import { CreateBranchDTO } from '../use-cases/branch/Branch'
import { generateUUID } from '../utils/uuid'

type BranchUpdatePayload = UpdateSucursalDTO & { serverId: number }

export class BranchService {
  constructor(
    private localRepo: IBranchRepository,
    private syncQueueRepo: ISyncQueueRepository,
    private apiRepo: IApiBranchRepository
  ) {}

  async findAll(): Promise<Branch[]> {
    return this.localRepo.findAll()
  }

  async create(dto: CreateBranchDTO): Promise<Branch> {
    const branch: Branch = {
      localId: generateUUID(),
      nombre: dto.nombre,
      direccion: dto.direccion,
      responsable: dto.responsable,
      codigo: dto.codigo,
      telefono: dto.telefono,
      ciudad: dto.ciudad,
      activa: dto.activa ?? true,
    }

    await this.localRepo.save(branch, false)

    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      entity: 'sucursal',
      entityId: branch.localId,
      operation: 'CREATE',
      payload: JSON.stringify({
        nombre: dto.nombre,
        direccion: dto.direccion,
        responsable: dto.responsable,
      } satisfies NuevaSucursalDTO),
      status: 'PENDING',
      retries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await this.syncQueueRepo.save(queueItem)
    return branch
  }

  async update(branch: Branch): Promise<void> {
    await this.localRepo.save(branch, false)

    if (!branch.serverId) return

    const payload: BranchUpdatePayload = {
      serverId: branch.serverId,
      nombre: branch.nombre,
      direccion: branch.direccion,
      responsable: branch.responsable,
      codigo: branch.codigo,
      telefono: branch.telefono,
      ciudad: branch.ciudad,
      activa: branch.activa,
    }

    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      entity: 'sucursal',
      entityId: branch.localId,
      operation: 'UPDATE',
      payload: JSON.stringify(payload),
      status: 'PENDING',
      retries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await this.syncQueueRepo.save(queueItem)
  }

  async toggleActive(localId: string): Promise<void> {
    const branch = await this.localRepo.findById(localId)
    if (!branch) return
    const updated = { ...branch, activa: !branch.activa }
    await this.localRepo.save(updated, false)

    if (!branch.serverId) return

    const payload: BranchUpdatePayload = {
      serverId: branch.serverId,
      activa: !branch.activa,
    }

    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      entity: 'sucursal',
      entityId: localId,
      operation: 'UPDATE',
      payload: JSON.stringify(payload),
      status: 'PENDING',
      retries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await this.syncQueueRepo.save(queueItem)
  }

  async syncPending(): Promise<void> {
    const pending = await this.syncQueueRepo.findPending(20)

    for (const item of pending) {
      if (item.entity !== 'sucursal') continue
      try {
        if (item.operation === 'CREATE') {
          const payload = JSON.parse(item.payload) as NuevaSucursalDTO
          const serverBranch = await this.apiRepo.create(payload)
          await this.localRepo.markAsSynced(item.entityId, serverBranch.id)
        } else if (item.operation === 'UPDATE') {
          const raw = JSON.parse(item.payload) as BranchUpdatePayload
          const { serverId, ...dto } = raw
          await this.apiRepo.update(serverId, dto)
        }
        await this.syncQueueRepo.markAsProcessed(item.id)
      } catch (e) {
        await this.syncQueueRepo.incrementRetries(item.id)
        console.warn(`[BranchService] sync falló para ${item.entityId}:`, e)
      }
    }
  }
}
