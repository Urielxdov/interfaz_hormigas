import { Branch } from "./Branch";

export interface PersistentBranch extends Branch {
  id: bigint
}