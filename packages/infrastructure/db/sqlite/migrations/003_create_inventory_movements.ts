export const migration003 = {
    version: 1,
    name: 'create_inventory_movements',
    up: `
        CREATE TABLE IF NOT EXISTS movimiento (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inventario_id INTEGER,
            usuario_id INTEGER,
            tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN (
            'COMPRA','VENTA','AJUSTE','MERMA','DEVOLUCION','TRASLADO_ENTRADA','TRASLADO_SALIDA'
            )),
            cantidad INTEGER NOT NULL,
            stock_anterior INTEGER NOT NULL,
            stock_nuevo INTEGER NOT NULL,
            referencia TEXT,
            fecha TEXT,
            sincronizado INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (inventario_id) REFERENCES inventario(id),
            FOREIGN KEY (usuario_id) REFERENCES usuario(id)
        );
    `
}