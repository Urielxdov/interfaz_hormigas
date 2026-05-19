import { useCallback, useEffect, useState } from 'react'
import { getMovimientoApi, MovimientoDTO, CrearMovimientoDTO } from '@/src/adapters/movimientoApiInstance'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

export function useMovimientos(sucursalId?: number) {
  const [movimientos, setMovimientos] = useState<MovimientoDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const { isOnline } = useNetwork()

  const cargar = useCallback(async () => {
    if (!isOnline) return
    setLoading(true)
    setError(null)
    try {
      const data = await getMovimientoApi().listar(sucursalId)
      setMovimientos(data)
    } catch {
      setError('Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }, [isOnline, sucursalId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const registrar = async (dto: CrearMovimientoDTO) => {
    setCreating(true)
    try {
      const nuevo = await getMovimientoApi().crear(dto)
      setMovimientos(prev => [nuevo, ...prev])
      return nuevo
    } finally {
      setCreating(false)
    }
  }

  return { movimientos, loading, error, creating, registrar, recargar: cargar }
}
