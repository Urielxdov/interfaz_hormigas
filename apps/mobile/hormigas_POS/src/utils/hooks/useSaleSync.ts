import { useEffect } from 'react'
import { AppState } from 'react-native'
import { getSaleService } from '@/src/adapters/saleServiceInstance'

const SYNC_INTERVAL_MS = 30_000

/**
 * Mantiene el dispositivo sincronizado mientras la sesion esta activa:
 *  - al montar y al volver a primer plano: envia ventas pendientes y baja catalogo/stock
 *  - cada 30 s: reintenta enviar las ventas pendientes
 * El servicio tiene un candado interno, asi que varias llamadas simultaneas no se solapan.
 */
export function useSaleSync(sucursalId: number) {
    useEffect(() => {
        if (!sucursalId) return

        let cancelled = false

        const pushOnly = async () => {
            try {
                const svc = await getSaleService()
                await svc.syncPending()
            } catch (e) {
                console.warn('[POS] syncPending falló:', e)
            }
        }

        const pushAndPull = async () => {
            try {
                const svc = await getSaleService()
                const res = await svc.syncPending()
                if (cancelled || res.interrupted) return
                await svc.pullProductsWithStock(sucursalId)
            } catch (e) {
                console.warn('[POS] sync/pull falló:', e)
            }
        }

        pushAndPull()
        const interval = setInterval(pushOnly, SYNC_INTERVAL_MS)
        const sub = AppState.addEventListener('change', state => {
            if (state === 'active') pushAndPull()
        })

        return () => {
            cancelled = true
            clearInterval(interval)
            sub.remove()
        }
    }, [sucursalId])
}
