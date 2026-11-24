export interface RunResult {
  /** Filas afectadas por INSERT/UPDATE/DELETE. */
  changes: number;
}

export interface DatabaseClient {
  run(query: string, params?: unknown[]): Promise<RunResult>;
  getOne<T>(query: string, params?: unknown[]): Promise<T | null>;
  getMany<T>(query: string, params?: unknown[]): Promise<T[]>;
  /**
   * Ejecuta `fn` en una transaccion: si lanza, se revierte todo lo escrito dentro.
   * Las consultas dentro de la transaccion deben hacerse con `tx` (puede ser otra conexion);
   * llamar a `transaction` sobre `tx` reutiliza la transaccion en curso.
   */
  transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T>;
  close?(): Promise<void>;
}
