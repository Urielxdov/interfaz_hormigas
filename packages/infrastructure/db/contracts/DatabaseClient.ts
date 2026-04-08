export interface DatabaseClient {
  run(query: string, params?: unknown[]): Promise<void>;
  getOne<T>(query: string, params?: unknown[]): Promise<T | null>;
  getMany<T>(query: string, params?: unknown[]): Promise<T[]>;
  close?(): Promise<void>;
}