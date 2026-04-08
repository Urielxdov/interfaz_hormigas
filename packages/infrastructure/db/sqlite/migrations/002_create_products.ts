export const migration002 = {
    version: 1,
    name: 'create_product',
    up: `
        CREATE TABLE IF NOT EXISTS producto (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL,
            sku TEXT NOT NULL,
            descripcion TEXT,
            precio REAL,
            activo INTEGER NOT NULL DEFAULT 1,
            categoria_id INTEGER,
            empresa_id INTEGER NOT NULL
        );
    `
}