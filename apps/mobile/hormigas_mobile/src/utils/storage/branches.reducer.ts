import { BranchItemListDTO, CreateBranchDTO } from "@hormigas/application";


export type BranchAction =
  | { type: 'SET'; payload: BranchItemListDTO[] }
  | { type: 'CREATE'; payload: BranchItemListDTO }
  | { type: 'UPDATE'; payload: BranchItemListDTO }
  | { type: 'TOGGLE_STATUS'; payload: bigint }

export function branchReducer(state: BranchItemListDTO[], action: BranchAction): BranchItemListDTO[] {
  switch (action.type) {
    case 'SET':
      return action.payload
    case 'CREATE':
      return [...state, action.payload]
    case 'UPDATE':
      return state.map(item =>
        item.id === action.payload.id ? { ...item, ...action.payload } : item
      )
    case 'TOGGLE_STATUS':
      return state.map(item =>
        item.id === action.payload ? { ...item, activa: !item.activa } : item
      )
    default:
      return state
  }
}