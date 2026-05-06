import { Tabs, Redirect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/src/auth/hooks/useAuth'
import { POSHeader } from '@/src/utils/components/POSHeader'

type IconName = React.ComponentProps<typeof Ionicons>['name']

export default function TabLayout() {
    const { token, isLoading } = useAuth()

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
