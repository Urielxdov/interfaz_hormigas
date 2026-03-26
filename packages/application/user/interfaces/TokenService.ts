

export interface TokenService {
    saveToken(token: string): Promise<void>
    getToken(): Promise<string | null>
    saveRefreshToken(token: string): Promise<void>
    getRefreshToken(): Promise<string | null>
    clearTokens(): Promise<void>
}