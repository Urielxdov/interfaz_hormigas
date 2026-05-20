import { useCallback, useEffect, useState } from 'react'
import { InventarioItemDTO, CreateInventarioDTO } from '@hormigas/application'
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
    setItems(data)
  }, [sucursalId])

  const syncFromServer = useCallback(async () => {
    try {
      const { api, sqlite } = await getInventarioRepos()
      const data = await api.listarPorSucursal(sucursalId)
      await sqlite.upsertMany(data)
      setItems(data)
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
      return exists ? prev.map(i => i.id === created.id ? created : i) : [...prev, created]
    })
    return created
  }

  const refresh = async () => {
    if (!isOnline) return
    await syncFromServer()
  }

  return { items, loading, error, crearInventario, refresh }
}
