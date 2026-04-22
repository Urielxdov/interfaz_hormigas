import { ISyncQueueRepository, SyncQueueItem } from '@hormigas/application'
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
    }
}

export class SqliteSyncQueueRepositoryImpl implements ISyncQueueRepository {
    constructor(private db: DatabaseClient) {}

    async save(item: SyncQueueItem): Promise<boolean> {
        await this.db.run(
            `INSERT OR REPLACE INTO sync_queue
             (id, entity, entity_id, operation, payload, status, retries, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            ]
        )
        return true
    }

    async findPending(limit = 20): Promise<SyncQueueItem[]> {
        const rows = await this.db.getMany<SyncQueueRow>(
            `SELECT * FROM sync_queue WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT ?`,
            [limit]
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
            `UPDATE sync_queue SET status = 'DONE', updated_at = ? WHERE id = ?`,
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

    async clearProcessed(): Promise<boolean> {
        await this.db.run(`DELETE FROM sync_queue WHERE status = 'DONE'`)
        return true
    }
}
