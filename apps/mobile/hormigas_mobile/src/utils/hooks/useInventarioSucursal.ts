import { useCallback, useEffect, useState } from 'react'
import { InventarioItemDTO, CreateInventarioDTO } from '@hormigas/application'
const porNombre = (a: InventarioItemDTO, b: InventarioItemDTO) =>
  (a.productoNombre ?? '').localeCompare(b.productoNombre ?? '', 'es')

import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getInventarioRepos } from '@/src/adapters/inventarioServiceInstance'

export function useInventarioSucursal(sucursalId: number) {
  const [items, setItems] = useState<InventarioItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isOnline } = useNetwork()

  const loadLocal = useCallback(async () => {
    const { sqlite } = await getInventarioRepos()
    const data = await sqlite.findBySucursal(sucursalId)
    setItems([...data].sort(porNombre))
  }, [sucursalId])

  const syncFromServer = useCallback(async () => {
    try {
      const { api, sqlite } = await getInventarioRepos()
      const data = await api.listarPorSucursal(sucursalId)
      await sqlite.upsertMany(data)
      setItems([...data].sort(porNombre))
    } catch (e) {
      console.warn('[useInventarioSucursal] syncFromServer:', e)
    }
  }, [sucursalId])

  useEffect(() => {
    setLoading(true)
    loadLocal()
      .then(() => { if (isOnline) return syncFromServer() })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [sucursalId, isOnline, loadLocal, syncFromServer])

  const crearInventario = async (dto: CreateInventarioDTO): Promise<InventarioItemDTO> => {
    const { api, sqlite } = await getInventarioRepos()
    const created = await api.crear(dto)
    await sqlite.upsertMany([created])
    setItems(prev => {
      const exists = prev.some(i => i.id === created.id)
      return (exists ? prev.map(i => i.id === created.id ? created : i) : [...prev, created]).sort(porNombre)
    })
    return created
  }

  // Estable (useCallback) para poder usarse en useFocusEffect sin recargar en bucle
  const refresh = useCallback(async () => {
    await loadLocal()
    if (isOnline) await syncFromServer()
  }, [loadLocal, syncFromServer, isOnline])

  return { items, loading, error, crearInventario, refresh }
}
