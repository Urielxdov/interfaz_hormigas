import { Tabs } from 'expo-router'
import { useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import RoleGate from '@/src/login/components/RoleGate'
import { ROUTE_ACCESS } from '@/src/login/utils/session'
import { usePosSession } from '@/src/pos/context/PosSessionProvider'
import { POSHeader } from '@/src/pos/components/POSHeader'
import { usePosColors } from '@/src/pos/theme'

/**
 * Punto de venta (venta + historial). USER aterriza aqui y no puede salir a las rutas
 * de administracion; ADMIN entra desde la pestaña del carrito y vuelve con la flecha.
 */
export default function PosLayout() {
    return (
        <RoleGate allow={ROUTE_ACCESS.pos}>
            <PosTabs />
        </RoleGate>
    )
}

function PosTabs() {
    const { setPosActive } = usePosSession()
    const c = usePosColors()

    // Dentro del POS se baja catalogo/stock de la sucursal (tambien para ADMIN).
    useEffect(() => {
        setPosActive(true)
        return () => setPosActive(false)
    }, [setPosActive])

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: c.primary,
                tabBarInactiveTintColor: c.faint,
                tabBarShowLabel: true,
                tabBarStyle: {
                    backgroundColor: c.card,
                    borderTopWidth: 1,
                    borderTopColor: c.border,
                    height: 60,
                    paddingBottom: 8,
                },
                sceneStyle: { backgroundColor: c.screen },
                header: () => <POSHeader />,
            }}
        >
            <Tabs.Screen
                name="venta"
                options={{
                    title: 'Venta',
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="historial"
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
