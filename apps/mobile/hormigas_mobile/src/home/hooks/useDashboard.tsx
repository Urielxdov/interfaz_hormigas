import { useCallback, useEffect, useState } from 'react'
import { BranchItemListDTO, LowStockItem, ProductWithStock } from '@hormigas/application'
import { Branch } from '@hormigas/domain'
import { getProductService } from '@/src/adapters/productServiceInstance'
import { getBranchService } from '@/src/adapters/branchServiceInstance'

function mapBranch(branch: Branch): BranchItemListDTO {
  return {
    id: branch.localId,
    serverId: branch.serverId,
    nombre: branch.nombre,
    direccion: branch.direccion,
    responsable: branch.responsable,
    activa: branch.activa,
  }
}

export type DashboardData = {
  totalProductos: number
  totalSucursales: number
  totalAlertas: number
  lowStockItems: LowStockItem[]
  branches: BranchItemListDTO[]
  isLoading: boolean
}

export function useDashboard(): DashboardData {
  const [totalProductos, setTotalProductos] = useState(0)
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [branches, setBranches] = useState<BranchItemListDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [productSvc, branchSvc] = await Promise.all([
        getProductService(),
        getBranchService(),
      ])
      const [products, lowStock, rawBranches] = await Promise.all([
        productSvc.findAllWithStock(),
        productSvc.getLowStock(),
        branchSvc.findAll(),
      ])
      setTotalProductos(products.length)
      setLowStockItems(lowStock)
      setBranches(rawBranches.map(mapBranch))
    } catch (e) {
      console.error('[useDashboard]', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return {
    totalProductos,
    totalSucursales: branches.length,
    totalAlertas: lowStockItems.length,
    lowStockItems,
    branches,
    isLoading,
  }
}
