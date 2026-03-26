import { UserResponseDTO } from './dto/User'

export interface UserRepository {
    getUsers(): Promise<UserResponseDTO[]>
    save(User:UserResponseDTO): Promise<void>
    findById(id: string): Promise<UserResponseDTO | null>
}