import { CREATE_TABLES_SQL } from '@hormigas/domain';
import { DatabaseConnectionFactory } from '../contracts/DatabaseConnectionFactory';

export async function initSqliteDatabase(
  factory: DatabaseConnectionFactory
): Promise<void> {
  const db = await factory.create();

  if (db.exec) {
    await db.exec(CREATE_TABLES_SQL);
  } else {
    throw new Error('Database client does not support exec');
  }
}