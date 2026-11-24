import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '@/src/login/hooks/useAuth'
import { getOwnerIdFromToken, getSucursalIdFromToken } from '@/src/login/utils/session'
import { useSaleSync } from '@/src/pos/hooks/useSaleSync'

const SUCURSAL_KEY_PREFIX = '@hormigas_pos_sucursal:'

interface PosSession {
  /** La sesion actual usa el POS (USER o ADMIN). */
  enabled: boolean
  /** Sucursal donde se vende; 0 = sin sucursal (no se puede vender). */
  sucursalId: number
  /** Usuario de la sesion (claim sub): dueño de las ventas en la cola. */
  ownerId: string | null
  /** ADMIN sin sucursal en el token: elige la sucursal del POS. */
  canChooseSucursal: boolean
  setSucursalId: (id: number) => void
  /** Lo llama el layout del POS al montarse/desmontarse (activa el pull de catalogo/stock). */
  setPosActive: (active: boolean) => void
}

const PosSessionContext = createContext<PosSession | null>(null)

/**
 * Sesion del POS para toda la app. Vive en el layout raiz para que la cola de ventas se
 * siga enviando aunque un ADMIN salga del POS al panel; solo corre con USER o ADMIN
 * (SUPER_ADMIN y sin sesion: nada en segundo plano).
 *  - USER: envio de ventas + pull de catalogo/stock de su sucursal (como el POS anterior).
 *  - ADMIN: envio de ventas siempre; el pull solo mientras esta dentro del POS.
 */
export function PosSessionProvider ({ children }: { children: React.ReactNode }) {
  const { token, role, logout } = useAuth()
  const enabled = !!token && (role === 'USER' || role === 'ADMIN')
  const tokenSucursal = token ? getSucursalIdFromToken(token) : null
  const ownerId = token ? getOwnerIdFromToken(token) : null
  const canChooseSucursal = enabled && role === 'ADMIN' && tokenSucursal == null

  const [chosen, setChosen] = useState<number | null>(null)
  const [posActive, setPosActive] = useState(false)
  const storageKey = `${SUCURSAL_KEY_PREFIX}${ownerId ?? ''}`

  useEffect(() => {
    setChosen(null)
    if (!canChooseSucursal) return
    AsyncStorage.getItem(storageKey)
      .then(v => {
        const n = Number(v)
        if (Number.isInteger(n) && n > 0) setChosen(n)
      })
      .catch(() => {})
  }, [canChooseSucursal, storageKey])

  const setSucursalId = useCallback((id: number) => {
    setChosen(id)
    AsyncStorage.setItem(storageKey, String(id)).catch(() => {})
  }, [storageKey])

  const sucursalId = tokenSucursal ?? (canChooseSucursal ? chosen ?? 0 : 0)

  const onSessionExpired = useCallback(() => {
    logout().finally(() => {
      router.replace('/(login)/login')
      Alert.alert(
        'Sesión expirada',
        'Inicia sesión de nuevo. Las ventas pendientes se enviarán al volver a entrar.'
      )
    })
  }, [logout])

  useSaleSync(enabled ? sucursalId : 0, ownerId, {
    token: enabled ? token : null,
    onSessionExpired,
    pull: role === 'USER' || posActive,
  })

  const value = useMemo<PosSession>(() => ({
    enabled,
    sucursalId,
    ownerId,
    canChooseSucursal,
    setSucursalId,
    setPosActive,
  }), [enabled, sucursalId, ownerId, canChooseSucursal, setSucursalId])

  return <PosSessionContext.Provider value={value}>{children}</PosSessionContext.Provider>
}

export function usePosSession (): PosSession {
  const ctx = useContext(PosSessionContext)
  if (!ctx) throw new Error('usePosSession debe usarse dentro de <PosSessionProvider>')
  return ctx
}
