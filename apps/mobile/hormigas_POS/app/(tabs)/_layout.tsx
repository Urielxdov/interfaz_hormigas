import { Tabs, Redirect, router } from 'expo-router'
import { useCallback } from 'react'
import { Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/src/auth/hooks/useAuth'
import { POSHeader } from '@/src/utils/components/POSHeader'
import { useSaleSync } from '@/src/utils/hooks/useSaleSync'
import { getOwnerIdFromToken, getSucursalIdFromToken } from '@/src/auth/hooks/useAuth'

type IconName = React.ComponentProps<typeof Ionicons>['name']

export default function TabLayout() {
    const { token, isLoading, logout } = useAuth()

    const onSessionExpired = useCallback(() => {
        logout().finally(() => {
            router.replace('/(login)')
            Alert.alert(
                'Sesión expirada',
                'Inicia sesión de nuevo. Las ventas pendientes se enviarán al volver a entrar.'
            )
        })
    }, [logout])

    useSaleSync(
        token ? (getSucursalIdFromToken(token) ?? 0) : 0,
        token ? getOwnerIdFromToken(token) : null,
        { token, onSessionExpired }
    )

    if (isLoading) return null
    if (!token) return <Redirect href="/(login)" />

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#111',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarShowLabel: true,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    height: 60,
                    paddingBottom: 8,
                },
                header: () => <POSHeader />,
            }}
        >
            <Tabs.Screen
                name="pos"
                options={{
                    title: 'Venta',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'Historial',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    )
}
