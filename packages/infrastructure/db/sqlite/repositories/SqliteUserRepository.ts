import { User } from '@hormigas/domain'

import { SqliteRepository } from "./SqliteRepository"

export interface SqliteUserRepository extends SqliteRepository<User> {
    findByEmail(email: string): Promise<User | null>
    findByCompanyId(companyId: string): Promise<User[]>
    findActive(): Promise<User[]>
}
