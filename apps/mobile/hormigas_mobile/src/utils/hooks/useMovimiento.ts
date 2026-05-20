import { useState } from 'react'
import { CrearMovimientoDTO, MovimientoDTO } from '@hormigas/application'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getMovimientoService } from '@/src/adapters/movimientoServiceInstance'

export function useMovimiento() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isOnline } = useNetwork()

  const registrar = async (dto: CrearMovimientoDTO): Promise<MovimientoDTO | null> => {
    setLoading(true)
    setError(null)
    try {
      const svc = await getMovimientoService()
      return await svc.registrar(dto, isOnline)
    } catch (e) {
      setError(String(e))
      throw e
    } finally {
      setLoading(false)
    }
  }

  return { registrar, loading, error }
}
