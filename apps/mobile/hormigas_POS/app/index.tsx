import { Redirect } from 'expo-router'
import { useAuth } from '@/src/auth/hooks/useAuth'

export default function Index() {
    const { token, isLoading } = useAuth()
    if (isLoading) return null
    return <Redirect href={token ? '/(tabs)/pos' : '/(login)'} />
}
