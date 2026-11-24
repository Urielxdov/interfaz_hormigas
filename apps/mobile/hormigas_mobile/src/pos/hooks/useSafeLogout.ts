import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { router } from 'expo-router'
import { useAuth } from '@/src/login/hooks/useAuth'
import { getOwnerIdFromToken } from '@/src/login/utils/session'
import { getSaleService } from '@/src/adapters/saleServiceInstance'

const ventas = (n: number) => `${n} venta${n !== 1 ? 's' : ''}`

/**
 * Cerrar sesion sin perder ventas: si el usuario tiene ventas sin enviar ofrece
 * "Sincronizar y salir" / "Salir sin enviar"; sin red bloquea el logout hasta poder enviar.
 * Sin ventas pendientes cierra sesion directo.
 */
export function useSafeLogout () {
  const { token, logout } = useAuth()
  const ownerId = token ? getOwnerIdFromToken(token) : null
  const [busy, setBusy] = useState(false)

  const doLogout = useCallback(async () => {
    await logout()
    router.replace('/(login)/login')
  }, [logout])

  const countPending = useCallback(async (): Promise<number> => {
    const svc = await getSaleService()
    const { pending } = await svc.getQueueCounts(ownerId)
    return pending
  }, [ownerId])

  const syncThenLogout = useCallback(async () => {
    setBusy(true)
    try {
      const svc = await getSaleService()
      await svc.syncPending({ ownerId })
      const remaining = await countPending()
      if (remaining === 0) {
        await doLogout()
        return
      }
      Alert.alert(
        'No se enviaron todas las ventas',
        `${remaining === 1 ? 'Queda' : 'Quedan'} ${ventas(remaining)} sin sincronizar. Se enviará${remaining === 1 ? '' : 'n'} cuando este usuario vuelva a iniciar sesión.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir de todos modos', style: 'destructive', onPress: () => { doLogout() } },
        ]
      )
    } catch (e) {
      console.warn('[POS] sync antes de cerrar sesión falló:', e)
      Alert.alert('Error', 'No se pudo sincronizar. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }, [ownerId, countPending, doLogout])

  const handleLogout = useCallback(async () => {
    let pending = 0
    try {
      pending = await countPending()
    } catch (e) {
      console.warn('[POS] no se pudo leer la cola:', e)
    }
    if (pending === 0) {
      await doLogout()
      return
    }

    const net = await NetInfo.fetch()
    const online = !!net.isConnected && net.isInternetReachable !== false
    if (!online) {
      Alert.alert(
        'Ventas sin enviar',
        `Hay ${ventas(pending)} sin sincronizar y no hay conexión. Conéctate a internet para enviar${pending === 1 ? 'la' : 'las'} antes de cerrar sesión.`
      )
      return
    }

    Alert.alert(
      'Ventas sin enviar',
      `Hay ${ventas(pending)} sin sincronizar. ¿Enviar${pending === 1 ? 'la' : 'las'} antes de cerrar sesión?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir sin enviar', style: 'destructive', onPress: () => { doLogout() } },
        { text: 'Sincronizar y salir', onPress: () => { syncThenLogout() } },
      ]
    )
  }, [countPending, doLogout, syncThenLogout])

  return { handleLogout, busy }
}
