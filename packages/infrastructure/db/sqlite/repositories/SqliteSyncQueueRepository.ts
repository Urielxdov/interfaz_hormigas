import { SqliteRepository } from "./SqliteRepository"

export interface SyncQueueItem {
    id: string
    entity: string
    entityId: string
    operation: string
    payload: string
    status: string
    retries: number
    createdAt: string
    updatedAt: string
}

export interface SqliteSyncQueueRepository extends SqliteRepository<SyncQueueItem> {
    findPending(limit?: number): Promise<SyncQueueItem[]>
    findByEntity(entity: string, entityId: string): Promise<SyncQueueItem[]>
    markAsProcessed(id: string): Promise<boolean>
    incrementRetries(id: string): Promise<boolean>
    clearProcessed(): Promise<boolean>
}
