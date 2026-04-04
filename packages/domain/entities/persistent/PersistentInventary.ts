import { Inventary } from "../local/Inventary";

export interface PersistentInventary extends Inventary {
  id: bigint
}