export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS sucursal (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    direccion TEXT,
    activa INTEGER NOT NULL DEFAULT 1,
    empresa_id INTEGER
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
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    sku TEXT NOT NULL,
    descripcion TEXT,
    precio REAL,
    activo INTEGER NOT NULL DEFAULT 1,
    categoria_id INTEGER,
    empresa_id INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inventario (
    id INTEGER PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER,
    stock_maximo INTEGER NOT NULL,
    ultima_actualizacion TEXT,
    UNIQUE (sucursal_id, producto_id),
    FOREIGN KEY (producto_id) REFERENCES producto(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id)
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
`;