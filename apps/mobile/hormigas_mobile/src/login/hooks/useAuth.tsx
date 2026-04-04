import { storage } from '@/src/adapters/AsyncStorageAdapter'
import { useEffect, useState } from 'react'
import { useNetwork } from '../../../../shared/context/NetworkContext'
import { useUserServiceFactorie } from '@hormigas/mobile-shared/hooks/useUserServiceFactory'
import { TokenService, UserRequestDTO } from '@hormigas/application'
import { TokenServiceImpl } from '@hormigas/infrastructure'

const tokenService: TokenService = new TokenServiceImpl(storage)

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { isOnline } = useNetwork()
  const userService = useUserServiceFactorie(tokenService, isOnline)

  // Cargar token al iniciar
  useEffect(() => {
    const loadToken = async () => {
      try {
        const savedToken = await tokenService.getToken()
        setToken(savedToken)
      } catch (error) {
        console.error('Error loading token', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadToken()
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

  return { token, isLoading, login, logout }
}
