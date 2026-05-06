import { storage } from '@/src/adapters/AsyncStorageAdapter'
import { TokenServiceImpl, UserServiceHTTP, ApiHttpClient } from '@hormigas/infrastructure'
import { TokenService, UserRequestDTO } from '@hormigas/application'
import { useEffect, useState } from 'react'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

const tokenService: TokenService = new TokenServiceImpl(storage)
const httpClient = new ApiHttpClient(API_URL, tokenService)
const userService = new UserServiceHTTP(tokenService, httpClient)

function decodeJWTPayload(token: string): Record<string, unknown> {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        return JSON.parse(atob(base64))
    } catch {
        return {}
    }
}

export function getSucursalIdFromToken(token: string): number | null {
    const payload = decodeJWTPayload(token)
    const id = payload['sucursalId']
    return typeof id === 'number' ? id : null
}

export const useAuth = () => {
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        tokenService
            .getToken()
            .then(setToken)
            .catch(() => setToken(null))
            .finally(() => setIsLoading(false))
    }, [])

    const login = async (dto: UserRequestDTO) => {
        await userService.login(dto)
        const saved = await tokenService.getToken()
        setToken(saved)
    }

    const logout = async () => {
        await tokenService.clearTokens()
        setToken(null)
    }

    return { token, isLoading, login, logout, tokenService }
}
