export interface SyncQueueItem {
    id: string
    entity: string
    entityId: string
    operation: 'CREATE' | 'UPDATE' | 'DELETE'
    payload: string
    status: 'PENDING' | 'DONE' | 'FAILED'
    retries: number
    createdAt: string
    updatedAt: string
}

export interface ISyncQueueRepository {
    save(item: SyncQueueItem): Promise<boolean>
    findPending(limit?: number): Promise<SyncQueueItem[]>
    findByEntity(entity: string, entityId: string): Promise<SyncQueueItem[]>
    markAsProcessed(id: string): Promise<boolean>
    incrementRetries(id: string): Promise<boolean>
    clearProcessed(): Promise<boolean>
}

export interface ISyncManager {
    syncPending(): Promise<void>
    pullFromServer(): Promise<void>
}
