export interface DatabaseClient {
  run(query: string, params?: unknown[]): Promise<{ changes: number }>;
  getOne<T>(query: string, params?: unknown[]): Promise<T | null>;
  getMany<T>(query: string, params?: unknown[]): Promise<T[]>;
  exec?(query: string): Promise<void>;
  close?(): Promise<void>;
}