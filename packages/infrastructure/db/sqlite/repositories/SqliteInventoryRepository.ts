import { Inventary } from '@hormigas/domain'

import { SqliteRepository } from "./SqliteRepository"

export interface SqliteInventoryRepository extends SqliteRepository<Inventary> {
    findByProductId(productId: number): Promise<Inventary[]>
    findByBranchId(branchId: number): Promise<Inventary[]>
    findByProductAndBranch(productId: number, branchId: number): Promise<Inventary | null>
}
