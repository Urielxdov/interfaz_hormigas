import { UsuarioResponseDTO } from '@hormigas/application'

export type UserAction =
  | { type: 'SET'; payload: UsuarioResponseDTO[] }
  | { type: 'CREATE'; payload: UsuarioResponseDTO }
  | { type: 'TOGGLE_STATUS'; payload: number }

export function userReducer(state: UsuarioResponseDTO[], action: UserAction): UsuarioResponseDTO[] {
  switch (action.type) {
    case 'SET':
      return action.payload
    case 'CREATE':
      return [...state, action.payload]
    case 'TOGGLE_STATUS':
      return state.map(u =>
        u.id === action.payload ? { ...u, activo: !u.activo } : u
      )
    default:
      return state
  }
}
