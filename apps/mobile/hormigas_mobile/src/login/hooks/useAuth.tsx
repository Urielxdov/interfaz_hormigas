import { storage } from '@/src/adapters/AsyncStorageAdapter'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { TokenService, UserRequestDTO } from '@hormigas/application'
import { TokenServiceImpl, UserServiceHTTP, ApiHttpClient } from '@hormigas/infrastructure'
import {
  AppRole,
  getRoleFromToken,
  isAdminEmpresaToken,
  isSuperAdminToken,
  isTokenExpired,
} from '@/src/login/utils/session'

export {
  getRolesFromToken,
  getRoleFromToken,
  getSucursalIdFromToken,
  getOwnerIdFromToken,
  homeRouteForRole,
  isAdminEmpresaToken,
  isSuperAdminToken,
  isTokenExpired,
} from '@/src/login/utils/session'
export type { AppRole } from '@/src/login/utils/session'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

/** Sesion unica de la app (un solo token en SecureStore para todos los roles). */
export const tokenService: TokenService = new TokenServiceImpl(storage)
const httpClient = new ApiHttpClient(API_URL, tokenService)
const userService = new UserServiceHTTP(tokenService, httpClient)

interface AuthContextValue {
  token: string | null
  isLoading: boolean
  role: AppRole | null
  isSuperAdmin: boolean
  isAdminEmpresa: boolean
  /** Inicia sesion; devuelve el token guardado. Lanza NetworkError / HttpError del ApiHttpClient. */
  login: (dto: UserRequestDTO) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider ({ children }: { children: React.ReactNode }) {
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

  const login = useCallback(async (dto: UserRequestDTO) => {
    await userService.login(dto)
    const saved = await tokenService.getToken()
    setToken(saved)
    return saved
  }, [])

  const logout = useCallback(async () => {
    await tokenService.clearTokens()
    setToken(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    token,
    isLoading,
    role: token ? getRoleFromToken(token) : null,
    isSuperAdmin: token ? isSuperAdminToken(token) : false,
    isAdminEmpresa: token ? isAdminEmpresaToken(token) : false,
    login,
    logout,
  }), [token, isLoading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
