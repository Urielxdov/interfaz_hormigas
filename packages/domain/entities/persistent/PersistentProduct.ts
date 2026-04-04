import { Product } from "../local/Product";

export interface PersistentProduct extends Product {
  id: bigint
}