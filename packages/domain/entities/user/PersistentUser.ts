import { User } from "./User"

export interface PersistentUser extends User {
  id: bigint
  syncedAt: Date
}