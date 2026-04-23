import { ApiHttpClient, TokenServiceImpl, UserServiceHTTP } from '@hormigas/infrastructure'
import { storage } from '@/adapters/AsyncStorageAdapter'
import { useState } from 'react'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''
const tokenService = new TokenServiceImpl(storage)
const httpClient = new ApiHttpClient(API_URL, tokenService)
const userService = new UserServiceHTTP(tokenService, httpClient)

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      await userService.login({ email, password })
      return tokenService.getToken()
    } catch (e: any) {
      setError(e?.message ?? 'Error al iniciar sesión')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error }
}
