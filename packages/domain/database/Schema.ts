export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS sucursal (
    local_id TEXT PRIMARY KEY,
    server_id INTEGER,
    nombre TEXT NOT NULL,
    direccion TEXT,
    responsable TEXT,
    codigo TEXT,
    telefono TEXT,
    ciudad TEXT,
    activa INTEGER NOT NULL DEFAULT 1,
    synced INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS usuario (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1,
    empresa_id INTEGER,
    fecha_creacion TEXT,
    ultimo_acceso TEXT
  );

  CREATE TABLE IF NOT EXISTS producto (
    local_id TEXT PRIMARY KEY,
    server_id INTEGER,
    nombre TEXT NOT NULL,
    sku TEXT NOT NULL,
    descripcion TEXT,
    precio REAL,
    activo INTEGER NOT NULL DEFAULT 1,
    categoria TEXT,
    synced INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS inventario (
    id INTEGER PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER,
    stock_maximo INTEGER NOT NULL,
    ultima_actualizacion TEXT,
    UNIQUE (sucursal_id, producto_id)
  );

  CREATE TABLE IF NOT EXISTS pos_producto (
    id INTEGER PRIMARY KEY,
    sucursal_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    sku TEXT,
    precio REAL,
    stock_actual INTEGER NOT NULL DEFAULT 0
  );

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

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    retries INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;