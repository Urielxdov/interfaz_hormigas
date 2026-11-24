import { UsuarioResponseDTO } from '@hormigas/application'

export type UserAction =
  | { type: 'SET'; payload: UsuarioResponseDTO[] }
  | { type: 'CREATE'; payload: UsuarioResponseDTO }
  | { type: 'UPDATE'; payload: UsuarioResponseDTO }

export function userReducer(state: UsuarioResponseDTO[], action: UserAction): UsuarioResponseDTO[] {
  switch (action.type) {
    case 'SET':
      return action.payload
    case 'CREATE':
      return [...state, action.payload]
    case 'UPDATE':
      return state.map(u => (u.id === action.payload.id ? action.payload : u))
    default:
      return state
  }
}
