import { useCallback, useEffect, useState } from 'react'
import { MovimientoDTO, CrearMovimientoDTO } from '@hormigas/application'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getMovimientoService } from '@/src/adapters/movimientoServiceInstance'

export function useMovimientos(sucursalId?: number, onMovimientoRegistrado?: () => void) {
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
      const svc = await getMovimientoService()
      const data = await svc.listar(sucursalId)
      setMovimientos(data)
    } catch {
      setError('Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }, [isOnline, sucursalId])

  useEffect(() => { cargar() }, [cargar])

  const registrar = async (dto: CrearMovimientoDTO) => {
    setCreating(true)
    try {
      const svc = await getMovimientoService()
      const result = await svc.registrar(dto, isOnline)
      if (result) setMovimientos(prev => [result, ...prev])
      onMovimientoRegistrado?.()
      return result
    } finally {
      setCreating(false)
    }
  }

  return { movimientos, loading, error, creating, registrar, recargar: cargar }
}
