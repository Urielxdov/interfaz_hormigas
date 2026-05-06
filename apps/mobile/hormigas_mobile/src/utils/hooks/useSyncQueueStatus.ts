import { useCallback, useEffect, useRef, useState } from 'react'
import { useNetwork } from '../../../../shared/context/NetworkContext'
import { getSyncQueueRepo } from '@/src/adapters/syncQueueInstance'

export type SyncStatus = 'syncing' | 'pending' | 'done'

export function useSyncQueueStatus(pollMs = 3000) {
    const [pendingCount, setPendingCount] = useState(0)
    const { isOnline } = useNetwork()
    const prevOnlineRef = useRef(isOnline)
    const [manualSyncing, setManualSyncing] = useState(false)

    const fetchCount = useCallback(async () => {
        try {
            const repo = await getSyncQueueRepo()
            const pending = await repo.findPending(100)
            setPendingCount(pending.length)
        } catch (e) {
            console.warn('[useSyncQueueStatus]', e)
        }
    }, [])

    // Detect going online → sync starts
    useEffect(() => {
        if (isOnline && !prevOnlineRef.current) {
            setManualSyncing(true)
            // Give sync time to finish, then re-fetch
            setTimeout(() => {
                fetchCount().finally(() => setManualSyncing(false))
            }, 2000)
        }
        prevOnlineRef.current = isOnline
    }, [isOnline, fetchCount])

    useEffect(() => {
        fetchCount()
        const id = setInterval(fetchCount, pollMs)
        return () => clearInterval(id)
    }, [fetchCount, pollMs])

    const status: SyncStatus = manualSyncing || (isOnline && pendingCount > 0)
        ? 'syncing'
        : pendingCount > 0
        ? 'pending'
        : 'done'

    return { pendingCount, status }
}
