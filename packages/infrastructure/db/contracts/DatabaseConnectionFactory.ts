import { DatabaseClient } from "./DatabaseClient";

export interface DatabaseConnectionFactory {
  create(): Promise<DatabaseClient>;
}