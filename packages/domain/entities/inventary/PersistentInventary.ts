import { Inventary } from "./Inventary";

export interface PersistentInventary extends Inventary {
  id: bigint
}