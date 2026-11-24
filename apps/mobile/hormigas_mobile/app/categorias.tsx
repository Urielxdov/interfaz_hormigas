import CategoriasScreen from '@/src/categorias/screens/CategoriasScreen'
import RoleGate from '@/src/login/components/RoleGate'
import { ROUTE_ACCESS } from '@/src/login/utils/session'
import { Stack } from 'expo-router'

export default function CategoriasPage() {
    return (
        <RoleGate allow={ROUTE_ACCESS.admin}>
            <Stack.Screen options={{ title: 'Categorías', headerShown: true }} />
            <CategoriasScreen />
        </RoleGate>
    )
}
