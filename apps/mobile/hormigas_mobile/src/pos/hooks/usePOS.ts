import { useCallback, useEffect, useRef, useState } from 'react'
import { CartItem, ProductWithStock, InsufficientStockError, NoInventoryError } from '@hormigas/application'
import { getSaleService } from '@/src/adapters/saleServiceInstance'
import { useToast } from '@/src/utils/components/ToastProvider'

export type { CartItem, ProductWithStock }

/**
 * Carrito y cobro del POS.
 * @param sucursalId sucursal donde se vende (0 = sin sucursal: no se puede registrar)
 * @param ownerId usuario de la sesion (dueño de la venta en la cola de sync)
 */
export function usePOS(sucursalId: number, ownerId: string | null) {

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ProductWithStock[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [montoRecibido, setMontoRecibido] = useState('')
    const [searching, setSearching] = useState(false)
    const [registering, setRegistering] = useState(false)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const toast = useToast()

    const search = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([])
            return
        }
        setSearching(true)
        try {
            const svc = await getSaleService()
            const found = await svc.searchProducts(q, sucursalId)
            setResults(found)
        } finally {
            setSearching(false)
        }
    }, [sucursalId])

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => search(query), 300)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [query, search])

    const addToCart = (product: ProductWithStock, cantidad: number) => {
        if (cantidad <= 0) return
        setCart(prev => {
            const existing = prev.find(i => i.productoLocalId === product.productoLocalId)
            if (existing) {
                return prev.map(i =>
                    i.productoLocalId === product.productoLocalId
                        ? { ...i, cantidad: i.cantidad + cantidad, subtotal: i.precio * (i.cantidad + cantidad) }
                        : i
                )
            }
            return [
                ...prev,
                {
                    productoLocalId: product.productoLocalId,
                    productoServerId: product.productoServerId,
                    nombre: product.nombre,
                    sku: product.sku,
                    precio: product.precio,
                    cantidad,
                    subtotal: product.precio * cantidad,
                },
            ]
        })
        setQuery('')
        setResults([])
    }

    const removeFromCart = (productoLocalId: string) => {
        setCart(prev => prev.filter(i => i.productoLocalId !== productoLocalId))
    }

    const updateCantidad = (productoLocalId: string, cantidad: number) => {
        if (cantidad <= 0) {
            removeFromCart(productoLocalId)
            return
        }
        setCart(prev =>
            prev.map(i => i.productoLocalId === productoLocalId ? { ...i, cantidad, subtotal: i.precio * cantidad } : i)
        )
    }

    const total = cart.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
    const montoNum = parseFloat(montoRecibido) || 0
    const cambio = Math.max(0, montoNum - total)

    const registerSale = async () => {
        if (!sucursalId) {
            setErrorMsg('Selecciona una sucursal para vender')
            return
        }
        if (cart.length === 0) {
            setErrorMsg('El carrito está vacío')
            return
        }
        if (montoNum < total) {
            setErrorMsg('Monto recibido insuficiente')
            return
        }
        setRegistering(true)
        setErrorMsg(null)
        try {
            const svc = await getSaleService()
            await svc.registerSale({
                sucursalServerId: sucursalId,
                items: cart,
                montoRecibido: montoNum,
                ownerId,
            })
            const totalVenta = total
            setCart([])
            setMontoRecibido('')
            setQuery('')
            setSuccessMsg(null)
            toast.show({
                type: 'success',
                title: 'Venta registrada',
                message: `Total $${totalVenta.toFixed(2)} · Cambio $${cambio.toFixed(2)}`,
            })
            // Intento inmediato de sync; si no hay red queda en cola. El servicio evita ejecuciones solapadas.
            svc.syncPending({ ownerId })
                .then(res => {
                    if (res.failed > 0) {
                        toast.show({
                            type: 'error',
                            title: 'Venta rechazada por el servidor',
                            message: 'Revisa las ventas fallidas en el indicador de sincronización.',
                        })
                    } else if (res.interrupted && res.reason !== 'auth') {
                        toast.show({
                            type: 'warning',
                            title: res.reason === 'network' ? 'Venta guardada sin conexión' : 'Venta guardada, servidor no disponible',
                            message: 'Se enviará automáticamente en cuanto sea posible.',
                        })
                    }
                })
                .catch(e => console.warn('[POS] sync tras venta falló:', e))
        } catch (e) {
            const message = e instanceof NoInventoryError
                ? e.message
                : e instanceof InsufficientStockError
                    ? e.message
                    : 'No se pudo guardar la venta. Intenta de nuevo.'
            if (!(e instanceof InsufficientStockError)) console.error('[POS] registerSale error:', e)
            setErrorMsg(message)
            toast.show({ type: 'error', title: 'Error en la venta', message })
        } finally {
            setRegistering(false)
        }
    }

    return {
        query, setQuery,
        results, searching,
        cart,
        addToCart, removeFromCart, updateCantidad,
        montoRecibido, setMontoRecibido,
        total, cambio,
        registering, registerSale,
        successMsg, errorMsg,
    }
}
