import { useEffect, useRef, useState } from 'react'
import { getSyncQueueRepo } from '@/src/adapters/syncQueueInstance'

export function useSyncQueueStatus() {
    const [pendingCount, setPendingCount] = useState(0)
    const [isSyncing, setIsSyncing] = useState(false)
    const prevCount = useRef(0)

    useEffect(() => {
        const check = async () => {
            try {
                const repo = await getSyncQueueRepo()
                const pending = await repo.findPending(100)
                const count = pending.length
                if (prevCount.current > 0 && count === 0) setIsSyncing(true)
                else setIsSyncing(false)
                prevCount.current = count
                setPendingCount(count)
            } catch {
                // silencioso
            }
        }
        check()
        const interval = setInterval(check, 3000)
        return () => clearInterval(interval)
    }, [])

    return { pendingCount, isSyncing }
}
