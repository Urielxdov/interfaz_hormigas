import { Stack } from 'expo-router'
import RoleGate from '@/src/login/components/RoleGate'
import { ROUTE_ACCESS } from '@/src/login/utils/session'

export default function BrancheLayout() {
  return (
    <RoleGate allow={ROUTE_ACCESS.admin}>
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          animationDuration: 280,
          headerShown: false,
        }}
      />
    </RoleGate>
  )
}
