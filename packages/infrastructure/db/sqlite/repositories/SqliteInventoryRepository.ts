import { Inventary } from "packages/domain/entities/inventary/Inventary"

import { SqliteRepository } from "./SqliteRepository"
import { DatabaseClient } from "../../contracts/DatabaseClient"
import { INVENTORY_MOVEMENTS_QUERYS } from "../schema/inventory_movements.schema"

export interface SqliteInventoryRepository extends SqliteRepository<Inventary> {
    findByProductId(productId: number): Promise<Inventary[]>
    findByBranchId(branchId: number): Promise<Inventary[]>
    findByProductAndBranch(productId: number, branchId: number): Promise<Inventary | null>
}

export class SqliteInventoryRepo implements SqliteRepository<Inventary> {
    constructor(private readonly db: DatabaseClient) {}

    findAll(): Promise<Inventary[]> {
        return this.db.getMany(INVENTORY_MOVEMENTS_QUERYS.findAll())
    }
    findById(id: string): Promise<Inventary | null> {
        return this.db.getOne(INVENTORY_MOVEMENTS_QUERYS.findById(id))
    }
    save(entity: Inventary): Promise<boolean> {
        throw new Error("Method not implemented.")
    }
    async deleteById(id: string): Promise<boolean> {
        throw new Error("No se permite borrar movimientos")
    }
    async existsById(id: string): Promise<boolean> {
        const result = await this.db.getOne<{ existe: number | boolean }>(
            INVENTORY_MOVEMENTS_QUERYS.existId(id)
        )

        return Boolean(result?.existe)
    }
    
}