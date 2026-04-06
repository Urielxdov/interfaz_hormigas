import { Transaction } from "./Transaction";

export interface PersistentTransaction extends Transaction {
  id: bigint
}