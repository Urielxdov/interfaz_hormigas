import { useEffect } from 'react'
import { AppState } from 'react-native'
import { getSaleService } from '@/src/adapters/saleServiceInstance'

const SYNC_INTERVAL_MS = 30_000

/**
 * Mantiene el dispositivo sincronizado mientras la sesion esta activa:
 *  - al montar y al volver a primer plano: envia ventas pendientes y baja catalogo/stock
 *    (syncAndPull: el pull corre bajo el mismo candado que el envio y se omite si
 *    otra sincronizacion estaba en curso o si la pasada se interrumpio)
 *  - cada 30 s: reintenta enviar las ventas pendientes (respetando el backoff de la cola)
 */
export function useSaleSync(sucursalId: number, ownerId: string | null = null) {
    useEffect(() => {
        if (!sucursalId) return

        const pushOnly = async () => {
            try {
                const svc = await getSaleService()
                await svc.syncPending({ ownerId })
            } catch (e) {
                console.warn('[POS] syncPending falló:', e)
            }
        }

        const pushAndPull = async () => {
            try {
                const svc = await getSaleService()
                await svc.syncAndPull(sucursalId, { ownerId })
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
            clearInterval(interval)
            sub.remove()
        }
    }, [sucursalId, ownerId])
}
