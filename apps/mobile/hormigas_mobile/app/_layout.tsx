import 'react-native-reanimated'
import '../global.css'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import Header from '@/src/utils/components/Header'
import { useInitDatabase } from '@/src/utils/hooks/useInitDatabase'
import { Text } from 'react-native'

export default function RootLayout () {
  const { isReady, error } = useInitDatabase()

  if (error) return <Text>Error iniciando la app</Text>
  if (!isReady) return null // nada se renderiza hasta que la DB esté lista

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          header: () => <Header />
        }}
      >
        <Stack.Screen name='(login)' options={{ headerShown: false }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: true }} />
      </Stack>
    </SafeAreaProvider>
  )
}
