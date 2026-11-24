import { Redirect } from 'expo-router'
import { useAuth } from '@/src/login/hooks/useAuth'
import { AppRole, canAccess, homeRouteForRole } from '@/src/login/utils/session'

interface Props {
  /** Roles que pueden ver este grupo de rutas. */
  allow: readonly AppRole[]
  children: React.ReactNode
}

/**
 * Guarda de rutas por rol. Sin sesion -> login; con un rol no permitido (p. ej. un cajero
 * que abre un deep link de administracion) -> la pantalla de inicio de su rol.
 */
export default function RoleGate ({ allow, children }: Props) {
  const { token, role, isLoading } = useAuth()

  if (isLoading) return null
  if (!token || !role) return <Redirect href='/(login)' />
  if (!canAccess(role, allow)) return <Redirect href={homeRouteForRole(role)} />

  return <>{children}</>
}
