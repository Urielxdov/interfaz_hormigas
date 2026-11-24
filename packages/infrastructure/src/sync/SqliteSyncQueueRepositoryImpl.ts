import { FindPendingOptions, ISyncQueueRepository, SyncQueueCounts, SyncQueueItem } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'

type SyncQueueRow = {
    id: string
    entity: string
    entity_id: string
    operation: string
    payload: string
    status: string
    retries: number
    created_at: string
    updated_at: string
    next_retry_at?: string | null
    owner_id?: string | null
}

function rowToItem(row: SyncQueueRow): SyncQueueItem {
    return {
        id: row.id,
        entity: row.entity,
        entityId: row.entity_id,
        operation: row.operation as SyncQueueItem['operation'],
        payload: row.payload,
        status: row.status as SyncQueueItem['status'],
        retries: row.retries,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        nextRetryAt: row.next_retry_at ?? null,
        ownerId: row.owner_id ?? null,
    }
}

/**
 * Columnas agregadas a sync_queue despues de la primera version. Las bases ya instaladas
 * se migran con ALTER TABLE, solo si la columna no existe (PRAGMA table_info).
 */
const SYNC_QUEUE_COLUMNS: { name: string; ddl: string }[] = [
    { name: 'next_retry_at', ddl: 'ALTER TABLE sync_queue ADD COLUMN next_retry_at TEXT' },
    { name: 'owner_id', ddl: 'ALTER TABLE sync_queue ADD COLUMN owner_id TEXT' },
]

/** Migracion idempotente de sync_queue. Llamar despues de CREATE_TABLES_SQL. */
export async function migrateSyncQueue(db: DatabaseClient): Promise<void> {
    const cols = await db.getMany<{ name: string }>('PRAGMA table_info(sync_queue)')
    const existing = new Set(cols.map(c => c.name))
    for (const col of SYNC_QUEUE_COLUMNS) {
        if (!existing.has(col.name)) await db.run(col.ddl)
    }
    await db.run(
        'CREATE INDEX IF NOT EXISTS idx_sync_queue_status_entity ON sync_queue (status, entity, next_retry_at)'
    )
}

export class SqliteSyncQueueRepositoryImpl implements ISyncQueueRepository {
    constructor(private db: DatabaseClient) { }

    async save(item: SyncQueueItem): Promise<boolean> {
        await this.db.run(
            `INSERT OR REPLACE INTO sync_queue
             (id, entity, entity_id, operation, payload, status, retries, created_at, updated_at, next_retry_at, owner_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                item.id,
                item.entity,
                item.entityId,
                item.operation,
                item.payload,
                item.status,
                item.retries,
                item.createdAt,
                item.updatedAt,
                item.nextRetryAt ?? null,
                item.ownerId ?? null,
            ]
        )
        return true
    }

    async findPending(limit = 20, options: FindPendingOptions = {}): Promise<SyncQueueItem[]> {
        const where = [`status = 'PENDING'`, `(next_retry_at IS NULL OR next_retry_at <= ?)`]
        const params: unknown[] = [options.now ?? new Date().toISOString()]
        if (options.entity) {
            where.push('entity = ?')
            params.push(options.entity)
        }
        if (options.ownerId) {
            // Items heredados (sin usuario) se envian con cualquier sesion.
            where.push('(owner_id IS NULL OR owner_id = ?)')
            params.push(options.ownerId)
        }
        params.push(limit)
        const rows = await this.db.getMany<SyncQueueRow>(
            `SELECT * FROM sync_queue WHERE ${where.join(' AND ')} ORDER BY created_at ASC LIMIT ?`,
            params
        )
        return rows.map(rowToItem)
    }

    async findByEntity(entity: string, entityId: string): Promise<SyncQueueItem[]> {
        const rows = await this.db.getMany<SyncQueueRow>(
            'SELECT * FROM sync_queue WHERE entity = ? AND entity_id = ?',
            [entity, entityId]
        )
        return rows.map(rowToItem)
    }

    async markAsProcessed(id: string): Promise<boolean> {
        await this.db.run(
            `UPDATE sync_queue SET status = 'DONE', next_retry_at = NULL, updated_at = ? WHERE id = ?`,
            [new Date().toISOString(), id]
        )
        return true
    }

    async markAsFailed(id: string): Promise<boolean> {
        await this.db.run(
            `UPDATE sync_queue SET status = 'FAILED', next_retry_at = NULL, updated_at = ? WHERE id = ?`,
            [new Date().toISOString(), id]
        )
        return true
    }

    async incrementRetries(id: string): Promise<boolean> {
        await this.db.run(
            `UPDATE sync_queue SET retries = retries + 1, updated_at = ? WHERE id = ?`,
            [new Date().toISOString(), id]
        )
        return true
    }

    async scheduleRetry(id: string, nextRetryAt: string): Promise<boolean> {
        await this.db.run(
            `UPDATE sync_queue SET retries = retries + 1, next_retry_at = ?, updated_at = ? WHERE id = ?`,
            [nextRetryAt, new Date().toISOString(), id]
        )
        return true
    }

    async countByStatus(entity?: string): Promise<SyncQueueCounts> {
        const rows = await this.db.getMany<{ status: string; n: number }>(
            `SELECT status, COUNT(*) AS n FROM sync_queue
             WHERE status IN ('PENDING', 'FAILED')${entity ? ' AND entity = ?' : ''}
             GROUP BY status`,
            entity ? [entity] : []
        )
        const counts: SyncQueueCounts = { pending: 0, failed: 0 }
        for (const r of rows) {
            if (r.status === 'PENDING') counts.pending = Number(r.n)
            else if (r.status === 'FAILED') counts.failed = Number(r.n)
        }
        return counts
    }

    async retryFailed(entity?: string): Promise<number> {
        const { changes } = await this.db.run(
            `UPDATE sync_queue SET status = 'PENDING', retries = 0, next_retry_at = NULL, updated_at = ?
             WHERE status = 'FAILED'${entity ? ' AND entity = ?' : ''}`,
            entity ? [new Date().toISOString(), entity] : [new Date().toISOString()]
        )
        return changes
    }

    async clearProcessed(): Promise<boolean> {
        await this.db.run(`DELETE FROM sync_queue WHERE status = 'DONE'`)
        return true
    }
}
