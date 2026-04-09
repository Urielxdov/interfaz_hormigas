/**
 * Definiciones de tablas, nombre de columnas y queries base
 */

export const SYNC_QUEUE_TABLE = 'sync_queue'

export const SYNC_QUEUE_COLUMNS = {
    id: 'id',
    entity: 'entity',
    entity_id: 'entity_id',
    operation: 'operation',
    payload: 'payload',
    status: 'status',
    retries: 'retries',
    created_at: 'created_at',
    updated_at: 'update_at'
}