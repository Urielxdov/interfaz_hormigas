import { Branch } from '@hormigas/domain'
import { IBranchRepository } from '../repositories/branch.repository'
import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { IApiBranchRepository, NuevaSucursalDTO } from '../port/branch-api.port'
import { CreateBranchDTO } from '../use-cases/branch/Branch'
import { generateUUID } from '../utils/uuid'

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
  }

  async toggleActive(localId: string): Promise<void> {
    const branch = await this.localRepo.findById(localId)
    if (!branch) return
    await this.localRepo.save({ ...branch, activa: !branch.activa }, false)
  }

  async syncPending(): Promise<void> {
    const pending = await this.syncQueueRepo.findPending(20)

    for (const item of pending) {
      try {
        if (item.entity !== 'sucursal') continue

        const payload = JSON.parse(item.payload) as NuevaSucursalDTO

        if (item.operation === 'CREATE') {
          const serverBranch = await this.apiRepo.create(payload)
          await this.localRepo.markAsSynced(item.entityId, serverBranch.id)
        }

        await this.syncQueueRepo.markAsProcessed(item.id)
      } catch (e) {
        await this.syncQueueRepo.incrementRetries(item.id)
        console.warn(`[BranchService] sync falló para ${item.entityId}:`, e)
      }
    }
  }
}
