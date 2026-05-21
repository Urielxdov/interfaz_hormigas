import { useCallback, useEffect, useRef, useState } from 'react'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getMovimientoService } from '@/src/adapters/movimientoServiceInstance'
import { getProductService } from '@/src/adapters/productServiceInstance'
import { getBranchService } from '@/src/adapters/branchServiceInstance'
import { getSyncQueueRepo } from '@/src/adapters/syncQueueInstance'

export function useSyncManager() {
  const { isOnline } = useNetwork()
  const prevOnlineRef = useRef(isOnline)
  const isSyncingRef = useRef(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncTrigger, setSyncTrigger] = useState(0)

  const runSync = useCallback(async () => {
    if (!isOnline || isSyncingRef.current) return
    isSyncingRef.current = true
    setIsSyncing(true)
    try {
      const [productSvc, movimientoSvc, branchSvc, syncQueueRepo] = await Promise.all([
        getProductService(),
        getMovimientoService(),
        getBranchService(),
        getSyncQueueRepo(),
      ])

      await productSvc.syncPending()
      await branchSvc.syncPending()
      await movimientoSvc.syncPending()
      await movimientoSvc.pullFromServer()
      await syncQueueRepo.clearProcessed()

      setLastSync(new Date())
    } catch (e) {
      console.warn('[useSyncManager] sync failed:', e)
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [isOnline])

  // Auto-sync solo al reconectar (online false → true)
  useEffect(() => {
    const wentOnline = isOnline && !prevOnlineRef.current
    prevOnlineRef.current = isOnline
    if (wentOnline) runSync()
  }, [isOnline, runSync])

  // Sync manual via triggerSync()
  useEffect(() => {
    if (syncTrigger === 0) return
    runSync()
  }, [syncTrigger, runSync])

  const triggerSync = useCallback(() => {
    setSyncTrigger(c => c + 1)
  }, [])

  return { isSyncing, lastSync, triggerSync }
}
