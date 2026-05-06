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
    console.log('➡️ Login request DTO:', dto)

    const data = await userService.login(dto)
    console.log('✅ Login response:', data)

    const savedToken = await tokenService.getToken()
    console.log('🔑 Saved token:', savedToken)

    setToken(savedToken)
    return data
  }

  const logout = async () => {
    console.log('🚪 Logging out...')
    await tokenService.clearTokens()
    setToken(null)
    console.log('❌ Tokens cleared')
  }

  return { token, isLoading, login, logout }
}
