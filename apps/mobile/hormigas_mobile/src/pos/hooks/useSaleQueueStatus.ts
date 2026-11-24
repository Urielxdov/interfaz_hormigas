import { useCallback, useEffect, useRef, useState } from 'react'
import { getSaleService } from '@/src/adapters/saleServiceInstance'

const POLL_MS = 3000

/**
 * Estado de la cola de ventas: pendientes (incluye las que esperan reintento) y
 * fallidas (FAILED, requieren accion: reintentar).
 */
export function useSaleQueueStatus(ownerId: string | null = null) {
    const [pendingCount, setPendingCount] = useState(0)
    const [failedCount, setFailedCount] = useState(0)
    const [isSyncing, setIsSyncing] = useState(false)
    const [retrying, setRetrying] = useState(false)
    const prevCount = useRef(0)

    const check = useCallback(async () => {
        try {
            const svc = await getSaleService()
            const { pending, failed } = await svc.getQueueCounts(ownerId)
            setIsSyncing(prevCount.current > 0 && pending === 0)
            prevCount.current = pending
            setPendingCount(pending)
            setFailedCount(failed)
        } catch {
            // silencioso
        }
    }, [ownerId])

    useEffect(() => {
        check()
        const interval = setInterval(check, POLL_MS)
        return () => clearInterval(interval)
    }, [check])

    /** Pasa las ventas FAILED a PENDING y lanza una sincronizacion. */
    const retryFailed = useCallback(async () => {
        setRetrying(true)
        try {
            const svc = await getSaleService()
            await svc.retryFailed()
            await check()
            await svc.syncPending({ ownerId })
        } catch (e) {
            console.warn('[POS] reintento de ventas fallidas falló:', e)
        } finally {
            setRetrying(false)
            check()
        }
    }, [check, ownerId])

    return { pendingCount, failedCount, isSyncing, retrying, retryFailed, refresh: check }
}
