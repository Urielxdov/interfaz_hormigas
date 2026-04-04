import { Branch } from "../local/Branch";

export interface PersistentBranch extends Branch {
  id: bigint
}