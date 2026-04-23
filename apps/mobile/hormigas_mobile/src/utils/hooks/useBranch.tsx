import { Branch } from '@hormigas/domain'
import { BranchItemListDTO, CreateBranchDTO } from '@hormigas/application'
import { useCallback, useEffect, useState } from 'react'
import { useNetwork } from '../../../../../shared/context/NetworkContext'
import { getBranchService } from '@/src/adapters/branchServiceInstance'

function mapToListDTO(branch: Branch): BranchItemListDTO {
  return {
    id: branch.localId,
    nombre: branch.nombre,
    direccion: branch.direccion,
    responsable: branch.responsable,
    activa: branch.activa,
  }
}

export function useBranches() {
  const [branches, setBranches] = useState<BranchItemListDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isOnline } = useNetwork()

  const loadBranches = useCallback(async () => {
    setIsLoading(true)
    try {
      const svc = await getBranchService()
      const domainBranches = await svc.findAll()
      setBranches(domainBranches.map(mapToListDTO))
    } catch (e) {
      console.error('[useBranches] loadBranches:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  useEffect(() => {
    if (!isOnline) return
    getBranchService()
      .then(svc => svc.syncPending())
      .then(loadBranches)
      .catch(e => console.warn('[useBranches] syncPending:', e))
  }, [isOnline, loadBranches])

  const createBranch = async (dto: CreateBranchDTO) => {
    const svc = await getBranchService()
    await svc.create(dto)
    await loadBranches()
  }

  const updateBranch = async (branch: Branch) => {
    const svc = await getBranchService()
    await svc.update(branch)
    await loadBranches()
  }

  const toggleStatus = async (id: string) => {
    const svc = await getBranchService()
    await svc.toggleActive(id)
    await loadBranches()
  }

  return { branches, isLoading, createBranch, updateBranch, toggleStatus }
}
