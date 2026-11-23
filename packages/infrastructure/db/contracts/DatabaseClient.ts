export interface RunResult {
  /** Filas afectadas por INSERT/UPDATE/DELETE. */
  changes: number;
}

export interface DatabaseClient {
  run(query: string, params?: unknown[]): Promise<RunResult>;
  getOne<T>(query: string, params?: unknown[]): Promise<T | null>;
  getMany<T>(query: string, params?: unknown[]): Promise<T[]>;
  /** Ejecuta `fn` en una transaccion: si lanza, se revierte todo lo escrito dentro. */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  close?(): Promise<void>;
}
