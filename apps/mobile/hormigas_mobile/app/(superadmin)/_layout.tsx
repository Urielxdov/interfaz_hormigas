import { Stack } from 'expo-router'
import RoleGate from '@/src/login/components/RoleGate'
import { ROUTE_ACCESS } from '@/src/login/utils/session'

export default function SuperAdminLayout() {
    return (
        <RoleGate allow={ROUTE_ACCESS.superadmin}>
            <Stack screenOptions={{ headerShown: false }} />
        </RoleGate>
    )
}
