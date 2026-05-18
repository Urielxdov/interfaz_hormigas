import { useState } from 'react'
import { CreateMovimientoDTO, MovimientoResponseDTO } from '@hormigas/application'
import { getMovimientoRepo } from '@/src/adapters/movimientoServiceInstance'

export function useMovimiento() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registrar = async (dto: CreateMovimientoDTO): Promise<MovimientoResponseDTO | null> => {
    setLoading(true)
    setError(null)
    try {
      const repo = await getMovimientoRepo()
      return await repo.crear(dto)
    } catch (e) {
      setError(String(e))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { registrar, loading, error }
}
