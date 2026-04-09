import * as SQLite from 'expo-sqlite';
import { DatabaseClient } from '../../contracts/DatabaseClient';
import { DatabaseConnectionFactory } from '../../contracts/DatabaseConnectionFactory';
import { ExpoSqliteClient } from './ExpoSqliteClient';

export class ExpoSqliteConnectionFactory implements DatabaseConnectionFactory {
  private instance: DatabaseClient | null = null;

  constructor(private readonly dbName: string) {}

  async create(): Promise<DatabaseClient> {
    if (this.instance) return this.instance;

    const db = await SQLite.openDatabaseAsync(this.dbName);
    this.instance = new ExpoSqliteClient(db);

    return this.instance;
  }
}