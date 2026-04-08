export const migration001 = {
    version: 1,
    name: 'create_users',
    up: `
        CREATE TABLE IF NOT EXISTS usuario (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL,
            correo TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            activo INTEGER NOT NULL DEFAULT 1,
            empresa_id INTEGER,
            fecha_creacion TEXT,
            ultimo_acceso TEXT
        )
    `
}