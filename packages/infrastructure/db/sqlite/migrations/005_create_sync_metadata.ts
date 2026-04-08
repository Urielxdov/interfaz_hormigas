export const migration005 = {
    version: 1,
    name: 'create_sync_metadata',
    up: `
        CREATE TABLE IF NOT EXISTS sync_metadata (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL
        )
    `
}