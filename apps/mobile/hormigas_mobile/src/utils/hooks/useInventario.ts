import { useCallback, useState } from 'react'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getInventarioApi, getInventarioLocalRepo, InventarioLocalItem } from '@/src/adapters/inventarioApiInstance'

export function useInventario() {
  const [lowStockItems, setLowStockItems] = useState<InventarioLocalItem[]>([])
  const [loading, setLoading] = useState(false)
  const { isOnline } = useNetwork()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const localRepo = await getInventarioLocalRepo()

      // Si falla la descarga (sin red, servidor caido, base ocupada) se muestra lo que hay en local.
      if (isOnline) {
        try {
          const serverItems = await getInventarioApi().stockBajo()
          for (const item of serverItems) {
            await localRepo.upsertFromServer(
              item.id, item.productoId, item.sucursalId,
              item.stockActual, item.stockMinimo, item.stockMaximo
            )
          }
        } catch (e) {
          console.warn('[useInventario] descarga de stock bajo falló:', e)
        }
      }

      const items = await localRepo.getLowStockItems()
      setLowStockItems(items)
    } catch (e) {
      console.warn('[useInventario] refresh failed:', e)
    } finally {
      setLoading(false)
    }
  }, [isOnline])

  return { lowStockItems, loading, refresh }
}
