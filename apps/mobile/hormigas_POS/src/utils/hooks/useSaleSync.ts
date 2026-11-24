import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { getSaleService } from '@/src/adapters/saleServiceInstance'
import { isTokenExpired } from '@/src/auth/hooks/useAuth'

const SYNC_INTERVAL_MS = 30_000

interface UseSaleSyncOptions {
    /** Token de la sesion; si expira no se sincroniza y se llama a onSessionExpired. */
    token: string | null
    /** Sesion caducada (exp vencido o 401/403 del servidor): forzar re-login. */
    onSessionExpired?: () => void
}

/**
 * Mantiene el dispositivo sincronizado mientras la sesion esta activa:
 *  - al montar y al volver a primer plano: envia ventas pendientes y baja catalogo/stock
 *    (syncAndPull: el pull corre bajo el mismo candado que el envio y se omite si
 *    otra sincronizacion estaba en curso o si la pasada se interrumpio)
 *  - cada 30 s: reintenta enviar las ventas pendientes (respetando el backoff de la cola)
 * Solo se envian las ventas del usuario de la sesion (ownerId) y las heredadas sin usuario.
 */
export function useSaleSync(sucursalId: number, ownerId: string | null, { token, onSessionExpired }: UseSaleSyncOptions) {
    const expiredRef = useRef(onSessionExpired)
    expiredRef.current = onSessionExpired

    useEffect(() => {
        if (!sucursalId || !token) return

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
                const res = withPull
                    ? await svc.syncAndPull(sucursalId, { ownerId })
                    : await svc.syncPending({ ownerId })
                if (res.reason === 'auth') sessionExpired()
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
    }, [sucursalId, ownerId, token])
}
