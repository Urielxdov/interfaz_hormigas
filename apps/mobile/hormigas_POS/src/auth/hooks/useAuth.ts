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
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
        return JSON.parse(atob(padded))
    } catch {
        return {}
    }
}

export function getSucursalIdFromToken(token: string): number | null {
    const payload = decodeJWTPayload(token)
    const id = payload['sucursalId']
    return typeof id === 'number' ? id : null
}

/**
 * true si el JWT ya expiro (claim `exp`, en segundos). `skewSeconds` adelanta la expiracion
 * para no enviar un token que caduca a medio request. Sin `exp` se considera vigente.
 */
export function isTokenExpired(token: string, nowMs: number = Date.now(), skewSeconds = 30): boolean {
    const exp = decodeJWTPayload(token)['exp']
    if (typeof exp !== 'number') return false
    return exp * 1000 - skewSeconds * 1000 <= nowMs
}

/** Identificador del usuario de la sesion (claim `sub`, el correo). */
export function getOwnerIdFromToken(token: string): string | null {
    const sub = decodeJWTPayload(token)['sub']
    return typeof sub === 'string' && sub !== '' ? sub : null
}

export const useAuth = () => {
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        tokenService
            .getToken()
            .then(async saved => {
                // Token caducado al arrancar: se fuerza re-login. Las ventas pendientes siguen
                // en la cola (con su usuario) y se envian al volver a iniciar sesion.
                if (saved && isTokenExpired(saved)) {
                    await tokenService.clearTokens()
                    setToken(null)
                    return
                }
                setToken(saved)
            })
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
