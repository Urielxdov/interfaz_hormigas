import { Product } from "./Product";

export interface PersistentProduct extends Product {
  id: bigint
}