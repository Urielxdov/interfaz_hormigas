import { BranchItemListDTO, CreateBranchDTO } from '@hormigas/application'
import { useReducer } from 'react'
import { branchReducer } from '../storage/branches.reducer'

const branchesMook: BranchItemListDTO[] = [
  {
    id: 1n,
    nombre: 'La perrona',
    responsable: 'El buen Baruc',
    estado: true
  },
  {
    id: 1n,
    nombre: 'La perrona 2.0',
    responsable: 'El buen Baruc (que chambeador)',
    estado: true
  }
]

export function useBranches (initial: BranchItemListDTO[] = []) {
  const [branches, dispatch] = useReducer(branchReducer, branchesMook)

  return {
    branches,
    createBranch: (data: CreateBranchDTO) =>
      dispatch({ type: 'CREATE', payload: data }),
    updateBranch: (branch: BranchItemListDTO) =>
      dispatch({ type: 'UPDATE', payload: branch }),
    toggleStatus: (id: bigint) =>
      dispatch({ type: 'TOGGLE_STATUS', payload: id })
  }
}
