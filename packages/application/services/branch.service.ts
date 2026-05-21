import { BranchItemListDTO, CreateBranchDTO } from '../use-cases/branch/Branch'
import { IApiBranchRepository } from '../port/branch-api.port'
import { ISyncQueueRepository, SyncQueueItem } from '../sync/sync.interfaces'
import { generateUUID } from '../utils/uuid'

const MAX_RETRIES = 5

export interface ILocalBranchRepository {
  save(dto: CreateBranchDTO): Promise<BranchItemListDTO>
  upsertMany(items: BranchItemListDTO[]): Promise<void>
}

export class BranchService {
  constructor(
    private localRepo: ILocalBranchRepository,
    private syncQueueRepo: ISyncQueueRepository,
    private apiRepo: IApiBranchRepository
  ) {}

  async create(dto: CreateBranchDTO): Promise<BranchItemListDTO> {
    const created = await this.localRepo.save(dto)

    const item: SyncQueueItem = {
      id: generateUUID(),
      entity: 'sucursal',
      entityId: String(created.id),
      operation: 'CREATE',
      payload: JSON.stringify(dto),
      status: 'PENDING',
      retries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await this.syncQueueRepo.save(item)
    return created
  }

  async syncPending(): Promise<void> {
    const pending = await this.syncQueueRepo.findPending(20)
    for (const item of pending) {
      if (item.entity !== 'sucursal') continue

      if (item.retries >= MAX_RETRIES) {
        await this.syncQueueRepo.markAsFailed(item.id)
        continue
      }

      try {
        const dto = JSON.parse(item.payload) as CreateBranchDTO
        const serverBranch = await this.apiRepo.crear(dto)
        await this.localRepo.upsertMany([serverBranch])
        await this.syncQueueRepo.markAsProcessed(item.id)
      } catch {
        await this.syncQueueRepo.incrementRetries(item.id)
      }
    }
  }
}
