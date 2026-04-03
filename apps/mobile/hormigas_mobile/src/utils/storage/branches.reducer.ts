import { BranchItemListDTO, CreateBranchDTO } from "@hormigas/application";


export type BranchAction =
  | { type: 'CREATE'; payload: CreateBranchDTO }
  | { type: 'UPDATE'; payload: BranchItemListDTO }
  | { type: 'TOGGLE_STATUS'; payload: bigint }

export function branchReducer(state: BranchItemListDTO[], action: BranchAction): BranchItemListDTO[] {
  switch (action.type) {
    case 'CREATE':
      return [...state, {
        ...action.payload,
        id: BigInt(Date.now()),
        responsable: ''
      }]
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