import 'react-native-reanimated'
import '../global.css'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import Header from '@/src/utils/components/Header'
import { useInitDatabase } from '@/src/utils/hooks/useInitDatabase'
import { Text, Appearance } from 'react-native'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect } from 'react'

export const THEME_STORAGE_KEY = '@hormigas_theme'

export default function RootLayout () {
  const { isReady, error } = useInitDatabase()

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then(saved => {
      if (saved === 'dark' || saved === 'light') {
        Appearance.setColorScheme(saved)
      }
    })
  }, [])

  if (error) return <Text>Error iniciando la app</Text>
  if (!isReady || !fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          header: () => <Header />
        }}
      >
        <Stack.Screen name='(login)' options={{ headerShown: false }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: true }} />
        <Stack.Screen name='(superadmin)' options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  )
}
