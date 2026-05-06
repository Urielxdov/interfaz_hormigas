import { NetworkProvider } from '../../shared/context/NetworkContext'
import { Redirect } from 'expo-router'
import { useAuth, isSuperAdminToken } from '@/src/login/hooks/useAuth'

function RootRedirect() {
    const { token, isLoading } = useAuth()
    if (isLoading) return null
    if (!token) return <Redirect href="/(login)" />
    return <Redirect href={isSuperAdminToken(token) ? '/(superadmin)' : '/(tabs)/home'} />
}

export default function App() {
    return (
        <NetworkProvider>
            <RootRedirect />
        </NetworkProvider>
    )
}
