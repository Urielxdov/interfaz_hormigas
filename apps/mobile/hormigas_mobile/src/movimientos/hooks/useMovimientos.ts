import { useCallback, useEffect, useState } from 'react'
import { MovimientoDTO, CrearMovimientoDTO } from '@hormigas/application'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getMovimientoService } from '@/src/adapters/movimientoServiceInstance'

const PAGE_SIZE = 20

export function useMovimientos(sucursalId?: number, onMovimientoRegistrado?: () => void) {
  const [movimientos, setMovimientos] = useState<MovimientoDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const { isOnline } = useNetwork()

  const cargar = useCallback(async (targetPage: number) => {
    if (!isOnline) return
    setLoading(true)
    setError(null)
    try {
      const svc = await getMovimientoService()
      const data = await svc.listar(sucursalId, targetPage, PAGE_SIZE)
      setMovimientos(data.content)
      setTotalPages(data.totalPages)
      setPage(data.number)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }, [isOnline, sucursalId])

  useEffect(() => { cargar(0) }, [cargar])

  const goNext = () => { if (page < totalPages - 1) cargar(page + 1) }
  const goPrev = () => { if (page > 0) cargar(page - 1) }

  const registrar = async (dto: CrearMovimientoDTO) => {
    setCreating(true)
    try {
      const svc = await getMovimientoService()
      const result = await svc.registrar(dto, isOnline)
      if (result) {
        // reload current page to reflect the new movimiento
        await cargar(0)
        setPage(0)
      }
      onMovimientoRegistrado?.()
      return result
    } finally {
      setCreating(false)
    }
  }

  return {
    movimientos,
    loading,
    error,
    creating,
    registrar,
    recargar: () => cargar(page),
    page,
    totalPages,
    goNext,
    goPrev,
  }
}
