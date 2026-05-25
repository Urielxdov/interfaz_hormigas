import { Stack } from 'expo-router'

export default function ProductDetailLayout() {
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
