import { CartItem, POSProductDTO, SucursalDTO } from '@hormigas/application'
import { useCallback, useEffect, useState } from 'react'
import { getPOSService } from '@/adapters/posServiceInstance'
import { useNetwork } from '@/context/NetworkContext'

export function usePOS(sucursalId: number) {
  const [products, setProducts] = useState<POSProductDTO[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const { isOnline } = useNetwork()

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const svc = await getPOSService()
      const local = await svc.getProducts(sucursalId)
      setProducts(local)
    } catch (e) {
      console.error('[usePOS] loadProducts:', e)
    } finally {
      setIsLoading(false)
    }
  }, [sucursalId])

  useEffect(() => { loadProducts() }, [loadProducts])

  useEffect(() => {
    if (!isOnline) return
    setIsSyncing(true)
    getPOSService()
      .then(svc => svc.syncPending())
      .then(() => getPOSService())
      .then(svc => svc.syncProducts(sucursalId))
      .then(loadProducts)
      .catch(e => console.warn('[usePOS] sync:', e))
      .finally(() => setIsSyncing(false))
  }, [isOnline, sucursalId, loadProducts])

  const addToCart = (product: POSProductDTO) => {
    setCart(prev => {
      const existing = prev.find(i => i.productoId === product.productoId)
      if (existing) {
        return prev.map(i =>
          i.productoId === product.productoId
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      }
      return [...prev, {
        productoId: product.productoId,
        nombre: product.nombre,
        precio: product.precio ?? 0,
        cantidad: 1,
      }]
    })
  }

  const removeFromCart = (productoId: number) => {
    setCart(prev => {
      const item = prev.find(i => i.productoId === productoId)
      if (!item) return prev
      if (item.cantidad === 1) return prev.filter(i => i.productoId !== productoId)
      return prev.map(i =>
        i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i
      )
    })
  }

  const clearCart = () => setCart([])

  const submitSale = async (): Promise<boolean> => {
    if (cart.length === 0) return false
    try {
      const svc = await getPOSService()
      await svc.submitSale(cart, sucursalId)
      clearCart()
      await loadProducts()
      if (isOnline) await svc.syncPending()
      return true
    } catch (e) {
      console.error('[usePOS] submitSale:', e)
      return false
    }
  }

  const total = cart.reduce((sum, i) => sum + i.precio * i.cantidad, 0)

  return { products, cart, total, isLoading, isSyncing, addToCart, removeFromCart, clearCart, submitSale }
}

export function useSucursales() {
  const [sucursales, setSucursales] = useState<SucursalDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    getPOSService()
      .then(svc => svc.getSucursales())
      .then(setSucursales)
      .catch(e => console.error('[useSucursales]', e))
      .finally(() => setIsLoading(false))
  }, [])

  return { sucursales, isLoading }
}
