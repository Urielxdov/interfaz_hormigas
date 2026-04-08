import { User } from "packages/domain/entities/user/User"

import { SqliteRepository } from "./SqliteRepository"

export interface SqliteUserRepository extends SqliteRepository<User> {
    findByEmail(email: string): Promise<User | null>
    findByCompanyId(companyId: string): Promise<User[]>
    findActive(): Promise<User[]>
}
