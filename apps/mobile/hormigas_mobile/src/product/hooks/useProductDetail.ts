import { useCallback, useEffect, useState } from 'react'
import { MovimientoDTO } from '@hormigas/application'
import { Product } from '@hormigas/domain'
import { getProductService } from '@/src/adapters/productServiceInstance'
import { getMovimientoService } from '@/src/adapters/movimientoServiceInstance'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

export function useProductDetail(localId: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [allMovimientos, setAllMovimientos] = useState<MovimientoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [notSynced, setNotSynced] = useState(false)
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'todas'>('todas')
  const { branches } = useBranches()
  const { isOnline } = useNetwork()

  const load = useCallback(async () => {
    setLoading(true)
    setNotSynced(false)
    try {
      const productSvc = await getProductService()
      const all = await productSvc.findAll()
      const found = all.find(p => p.localId === localId) ?? null
      setProduct(found)

      if (!found?.categoriaId) {
        setNotSynced(true)
        return
      }

      if (!isOnline) return

      const movSvc = await getMovimientoService()
      const data = await movSvc.buscarPorProducto(found.categoriaId)
      setAllMovimientos(data)
    } catch (e) {
      console.error('[useProductDetail]', e)
    } finally {
      setLoading(false)
    }
  }, [localId, isOnline])

  useEffect(() => { load() }, [load])

  const movimientos =
    selectedBranchId === 'todas'
      ? allMovimientos
      : allMovimientos.filter(m => m.sucursalId === selectedBranchId)

  const branchesWithMovimientos = branches.filter(b =>
    allMovimientos.some(m => m.sucursalId === Number(b.id))
  )

  return {
    product,
    movimientos,
    allMovimientos,
    branches,
    branchesWithMovimientos,
    loading,
    notSynced,
    selectedBranchId,
    setSelectedBranchId,
  }
}
