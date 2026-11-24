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
    /** ISO-8601; no se reintenta antes de esta fecha (backoff). null = cuanto antes. */
    nextRetryAt?: string | null
    /** Usuario que genero el item; no se envia con la sesion de otro usuario. */
    ownerId?: string | null
}

export interface FindPendingOptions {
    /** Solo items de esta entidad (p. ej. 'venta'). */
    entity?: string
    /** Solo items de este usuario (o sin usuario, items heredados). */
    ownerId?: string | null
    /** Momento actual (ISO); solo items con next_retry_at <= now. Por defecto, ahora. */
    now?: string
}

export interface SyncQueueCounts {
    pending: number
    failed: number
}

export interface ISyncQueueRepository {
    save(item: SyncQueueItem): Promise<boolean>
    /** Items PENDING listos para enviarse (next_retry_at vencido), del mas antiguo al mas nuevo. */
    findPending(limit?: number, options?: FindPendingOptions): Promise<SyncQueueItem[]>
    findByEntity(entity: string, entityId: string): Promise<SyncQueueItem[]>
    markAsProcessed(id: string): Promise<boolean>
    markAsFailed(id: string): Promise<boolean>
    incrementRetries(id: string): Promise<boolean>
    /** Cuenta un intento fallido y programa el siguiente para `nextRetryAt`. */
    scheduleRetry(id: string, nextRetryAt: string): Promise<boolean>
    /** Cuenta PENDING (incluye los que esperan backoff) y FAILED; con ownerId, solo los suyos y heredados. */
    countByStatus(entity?: string, ownerId?: string | null): Promise<SyncQueueCounts>
    /** Pasa FAILED -> PENDING con reintentos en 0. Devuelve cuantos se reactivaron. */
    retryFailed(entity?: string): Promise<number>
    clearProcessed(): Promise<boolean>
}

export interface ISyncManager {
    syncPending(): Promise<void>
    pullFromServer(): Promise<void>
}
