import * as SQLite from 'expo-sqlite';
import { DatabaseClient } from '../../contracts/DatabaseClient';

export class ExpoSqliteClient implements DatabaseClient {
  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  async run(query: string, params: unknown[] = []): Promise<void> {
    await this.db.runAsync(query, params);
  }

  async getOne<T>(query: string, params: unknown[] = []): Promise<T | null> {
    const row = await this.db.getFirstAsync<T>(query, params);
    return row ?? null;
  }

  async getMany<T>(query: string, params: unknown[] = []): Promise<T[]> {
    return await this.db.getAllAsync<T>(query, params);
  }

  async exec(query: string): Promise<void> {
    await this.db.execAsync(query);
  }
}