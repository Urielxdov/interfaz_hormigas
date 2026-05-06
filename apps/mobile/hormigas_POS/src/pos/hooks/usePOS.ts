import { useCallback, useEffect, useRef, useState } from 'react'
import { CartItem, ProductWithStock } from '@hormigas/application'
import { getSaleService } from '@/src/adapters/saleServiceInstance'
import { getSucursalIdFromToken } from '@/src/auth/hooks/useAuth'

export type { CartItem, ProductWithStock }

export function usePOS(token: string | null) {
    const sucursalId = token ? (getSucursalIdFromToken(token) ?? 0) : 0

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ProductWithStock[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [montoRecibido, setMontoRecibido] = useState('')
    const [searching, setSearching] = useState(false)
    const [registering, setRegistering] = useState(false)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
                        ? { ...i, cantidad: i.cantidad + cantidad }
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
            prev.map(i => i.productoLocalId === productoLocalId ? { ...i, cantidad } : i)
        )
    }

    const total = cart.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
    const montoNum = parseFloat(montoRecibido) || 0
    const cambio = Math.max(0, montoNum - total)

    const registerSale = async () => {
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
            })
            setCart([])
            setMontoRecibido('')
            setQuery('')
            setSuccessMsg(`Venta registrada. Cambio: $${cambio.toFixed(2)}`)
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch (e) {
            setErrorMsg('Error al registrar la venta')
            console.error('[POS] registerSale error:', e)
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
