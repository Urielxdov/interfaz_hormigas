import { Transaction } from "../local/Transaction";

export interface PersistentTransaction extends Transaction {
  id: bigint
}