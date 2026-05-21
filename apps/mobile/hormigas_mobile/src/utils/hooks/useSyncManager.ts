import { useEffect, useRef, useState } from 'react'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { useSyncQueueStatus } from './useSyncQueueStatus'
import { getMovimientoService } from '@/src/adapters/movimientoServiceInstance'
import { getProductService } from '@/src/adapters/productServiceInstance'

export function useSyncManager() {
  const { isOnline } = useNetwork()
  const { pendingCount } = useSyncQueueStatus()
  const prevOnlineRef = useRef(isOnline)
  const isSyncingRef = useRef(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const wentOnline = isOnline && !prevOnlineRef.current
    prevOnlineRef.current = isOnline

    if (!isOnline || pendingCount === 0 || isSyncingRef.current) return

    const run = async () => {
      isSyncingRef.current = true
      setIsSyncing(true)
      try {
        const productSvc = await getProductService()
        await productSvc.syncPending()

        const movimientoSvc = await getMovimientoService()
        await movimientoSvc.syncPending()
        await movimientoSvc.pullFromServer()
        setLastSync(new Date())
      } catch (e) {
        console.warn(`[useSyncManager] sync ${wentOnline ? 'after reconnect' : 'while online'} failed:`, e)
      } finally {
        isSyncingRef.current = false
        setIsSyncing(false)
      }
    }

    run()
  }, [isOnline, pendingCount])

  return { isSyncing, lastSync }
}
