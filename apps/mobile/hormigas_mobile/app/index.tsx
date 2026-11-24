import { Redirect } from 'expo-router'
import { useAuth } from '@/src/login/hooks/useAuth'
import { homeRouteForRole } from '@/src/login/utils/session'

/** Entrada de la app: cada rol aterriza en su pantalla (ver HOME_ROUTE en session.ts). */
export default function RootRedirect() {
    const { token, role, isLoading } = useAuth()
    if (isLoading) return null
    if (!token || !role) return <Redirect href="/(login)" />
    return <Redirect href={homeRouteForRole(role)} />
}
