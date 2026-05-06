import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/src/login/hooks/useAuth'

export default function SuperAdminLayout() {
    const { token, isLoading, isSuperAdmin } = useAuth()

    if (isLoading) return null
    if (!token) return <Redirect href="/(login)" />
    if (!isSuperAdmin) return <Redirect href="/(tabs)/home" />

    return (
        <Stack screenOptions={{ headerShown: false }} />
    )
}
