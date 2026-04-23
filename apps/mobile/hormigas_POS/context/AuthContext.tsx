import { TokenServiceImpl } from '@hormigas/infrastructure'
import { storage } from '@/adapters/AsyncStorageAdapter'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

const tokenService = new TokenServiceImpl(storage)

const BRANCH_KEY = 'selected_branch_id'
const BRANCH_NAME_KEY = 'selected_branch_name'

type AuthContextType = {
  token: string | null
  branchId: number | null
  branchName: string | null
  isLoading: boolean
  setToken: (t: string | null) => void
  selectBranch: (id: number, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)
  const [branchId, setBranchId] = useState<number | null>(null)
  const [branchName, setBranchName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      tokenService.getToken(),
      storage.getItem(BRANCH_KEY),
      storage.getItem(BRANCH_NAME_KEY),
    ]).then(([t, bid, bname]) => {
      setTokenState(t)
      setBranchId(bid ? Number(bid) : null)
      setBranchName(bname)
    }).finally(() => setIsLoading(false))
  }, [])

  const setToken = (t: string | null) => {
    setTokenState(t)
    if (t) tokenService.saveToken(t)
    else tokenService.clearTokens()
  }

  const selectBranch = async (id: number, name: string) => {
    await storage.setItem(BRANCH_KEY, String(id))
    await storage.setItem(BRANCH_NAME_KEY, name)
    setBranchId(id)
    setBranchName(name)
  }

  const logout = async () => {
    await tokenService.clearTokens()
    await storage.removeItem(BRANCH_KEY)
    await storage.removeItem(BRANCH_NAME_KEY)
    setTokenState(null)
    setBranchId(null)
    setBranchName(null)
  }

  return (
    <AuthContext.Provider value={{ token, branchId, branchName, isLoading, setToken, selectBranch, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
