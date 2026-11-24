import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { getSaleService } from '@/src/adapters/saleServiceInstance'
import { isTokenExpired } from '@/src/login/utils/session'
import { useToast } from '@/src/utils/components/ToastProvider'

const SYNC_INTERVAL_MS = 30_000

interface UseSaleSyncOptions {
    /** Token de la sesion; null desactiva la sincronizacion. Si expira se llama a onSessionExpired. */
    token: string | null
    /** Sesion caducada (exp vencido o 401/403 del servidor): forzar re-login. */
    onSessionExpired?: () => void
    /**
     * Bajar catalogo/stock de la sucursal (syncAndPull) al montar y al volver a primer plano.
     * Sin pull (o sin sucursal) solo se envian las ventas pendientes.
     */
    pull?: boolean
}

/**
 * Mantiene el dispositivo sincronizado mientras la sesion esta activa:
 *  - al montar y al volver a primer plano: envia ventas pendientes y, con `pull` y sucursal,
 *    baja catalogo/stock (syncAndPull: el pull corre bajo el mismo candado que el envio y se
 *    omite si otra sincronizacion estaba en curso o si la pasada se interrumpio)
 *  - cada 30 s: reintenta enviar las ventas pendientes (respetando el backoff de la cola)
 * Solo se envian las ventas del usuario de la sesion (ownerId) y las heredadas sin usuario.
 */
export function useSaleSync(
    sucursalId: number,
    ownerId: string | null,
    { token, onSessionExpired, pull = true }: UseSaleSyncOptions
) {
    const expiredRef = useRef(onSessionExpired)
    expiredRef.current = onSessionExpired
    const toast = useToast()
    const toastRef = useRef(toast)
    toastRef.current = toast

    useEffect(() => {
        if (!token) return

        let notified = false
        const sessionExpired = () => {
            if (notified) return
            notified = true
            expiredRef.current?.()
        }

        const run = async (withPull: boolean) => {
            if (isTokenExpired(token)) {
                sessionExpired()
                return
            }
            try {
                const svc = await getSaleService()
                const res = withPull && pull && sucursalId
                    ? await svc.syncAndPull(sucursalId, { ownerId })
                    : await svc.syncPending({ ownerId })
                if (res.reason === 'auth') sessionExpired()
                // Ventas que estaban en cola (sin conexion / servidor caido) y se enviaron ahora
                if (res.failed > 0) {
                    toastRef.current.show({
                        type: 'error',
                        title: res.failed === 1 ? '1 venta rechazada por el servidor' : `${res.failed} ventas rechazadas por el servidor`,
                        message: 'Revisa las ventas fallidas en el indicador de sincronización.',
                    })
                } else if (res.synced > 0) {
                    toastRef.current.show({
                        type: 'info',
                        title: res.synced === 1 ? 'Venta pendiente enviada' : `${res.synced} ventas pendientes enviadas`,
                        message: 'Ya están registradas en el servidor.',
                    })
                }
            } catch (e) {
                console.warn('[POS] sync/pull falló:', e)
            }
        }

        run(true)
        const interval = setInterval(() => run(false), SYNC_INTERVAL_MS)
        const sub = AppState.addEventListener('change', state => {
            if (state === 'active') run(true)
        })

        return () => {
            clearInterval(interval)
            sub.remove()
        }
    }, [sucursalId, ownerId, token, pull])
}
