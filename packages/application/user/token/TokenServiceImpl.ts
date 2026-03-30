import { TokenService } from "@hormigas/application/user/interfaces/TokenService";
import { IStorage } from '@hormigas/application/storage/IStorage'

const TOKEN_KEY = 'Authorization'
const REFRESH_TOKEN_KEY = 'refresh_token'

export class TokenServiceImpl implements TokenService {

    constructor (private storage: IStorage) {}
    
    async saveToken(token: string): Promise<void> {
        await this.storage.setItem(TOKEN_KEY, token)
    }
    async getToken(): Promise<string | null> {
        return await this.storage.getItem(TOKEN_KEY)
    }
    async saveRefreshToken(token: string): Promise<void> {
        await this.storage.setItem(REFRESH_TOKEN_KEY, token)
    }
    async getRefreshToken(): Promise<string | null> {
        return await this.storage.getItem(REFRESH_TOKEN_KEY)
    }
    async clearTokens(): Promise<void> {
        await this.storage.removeItem(TOKEN_KEY)
        await this.storage.removeItem(REFRESH_TOKEN_KEY)
    }

}