import { User } from "../local/User";

export interface PersistentUser extends User {
  id: bigint
}