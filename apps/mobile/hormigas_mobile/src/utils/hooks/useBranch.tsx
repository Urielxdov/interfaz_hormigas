import { useCallback, useEffect, useReducer } from 'react'
import { BranchItemListDTO, CreateBranchDTO } from '@hormigas/application'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getBranchRepos } from '@/src/adapters/branchRepoInstance'
import { getBranchService } from '@/src/adapters/branchServiceInstance'
import { branchReducer } from '../storage/branches.reducer'

export function useBranches () {
  const [branches, dispatch] = useReducer(branchReducer, [])
  const { isOnline } = useNetwork()

  const loadLocal = useCallback(async () => {
    try {
      const { sqlite } = await getBranchRepos()
      const data = await sqlite.findAll()
      dispatch({ type: 'SET', payload: data })
    } catch (e) {
      console.error('[useBranches] loadLocal:', e)
    }
  }, [])

  const syncFromServer = useCallback(async () => {
    try {
      const { api, sqlite } = await getBranchRepos()
      const data = await api.listar()
      await sqlite.upsertMany(data)
      dispatch({ type: 'SET', payload: data })
    } catch (e) {
      console.warn('[useBranches] syncFromServer:', e)
    }
  }, [])

  useEffect(() => {
    loadLocal()
  }, [loadLocal])

  useEffect(() => {
    if (!isOnline) return
    syncFromServer()
  }, [isOnline, syncFromServer])

  const createBranch = async (dto: CreateBranchDTO) => {
    const svc = await getBranchService()
    const created = await svc.create(dto)
    dispatch({ type: 'CREATE', payload: created })
    return created
  }

  const updateBranch = (branch: BranchItemListDTO) =>
    dispatch({ type: 'UPDATE', payload: branch })

  const toggleStatus = (id: bigint) =>
    dispatch({ type: 'TOGGLE_STATUS', payload: id })

  return { branches, createBranch, updateBranch, toggleStatus }
}
