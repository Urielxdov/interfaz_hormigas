import { Stack } from 'expo-router'

export default function BrancheLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        animationDuration: 280,
        headerShown: false,
      }}
    />
  )
}
