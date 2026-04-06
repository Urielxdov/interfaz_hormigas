import { User } from "../User";

export interface UserRepository {
    findById(id: string): Promise<User | null>
    finByEmail(email: string): Promise<User | null>
    save(user: User): Promise<boolean>
}