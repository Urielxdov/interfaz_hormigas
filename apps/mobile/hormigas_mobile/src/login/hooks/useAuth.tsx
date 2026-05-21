import { storage } from '@/src/adapters/AsyncStorageAdapter'
import UserServiceOfflineAdapter from '@/src/adapters/UserServiceOfflineAdapter'
import { useEffect, useRef, useState } from 'react'

import { useNetwork } from '../../../../shared/context/NetworkContext'
import { useUserServiceFactorie } from '@hormigas/mobile-shared/hooks/useUserServiceFactory'
import { TokenService, UserRequestDTO } from '@hormigas/application'
import {
  TokenServiceImpl,
  UserServiceHTTP,
  ApiHttpClient
} from '@hormigas/infrastructure'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

const tokenService: TokenService = new TokenServiceImpl(storage)
const httpClient = new ApiHttpClient(API_URL, tokenService)
const onlineAdapter = new UserServiceHTTP(tokenService, httpClient)
const offlineAdapter = new UserServiceOfflineAdapter()

function decodeJWTPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return {}
  }
}

export function getRolesFromToken(token: string): string[] {
  const payload = decodeJWTPayload(token)
  const roles = payload['roles']
  if (typeof roles !== 'string') return []
  return roles.split(' ')
}

export function isSuperAdminToken(token: string): boolean {
  return getRolesFromToken(token).includes('ROLE_SUPER_ADMIN')
}

export function isAdminEmpresaToken(token: string): boolean {
  return getRolesFromToken(token).includes('ROLE_ADMIN')
}

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { isOnline } = useNetwork()
  const userService = useUserServiceFactorie(
    onlineAdapter,
    offlineAdapter,
    isOnline
  )

  useEffect(() => {
    tokenService
      .getToken()
      .then(setToken)
      .catch(() => setToken(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (dto: UserRequestDTO) => {
    const data = await userService.login(dto)
    const savedToken = await tokenService.getToken()
    setToken(savedToken)
    return data
  }

  const logout = async () => {
    await tokenService.clearTokens()
    setToken(null)
  }

  const isSuperAdmin = token ? isSuperAdminToken(token) : false
  const isAdminEmpresa = token ? isAdminEmpresaToken(token) : false

  return { token, isLoading, login, logout, isSuperAdmin, isAdminEmpresa }
}
