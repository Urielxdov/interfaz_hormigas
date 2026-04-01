import 'react-native-reanimated'
import '../global.css'

import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import Header from '@/src/utils/components/Header'

export default function RootLayout () {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ 
        header: () => <Header/>  // ← aquí, aplica a todas las pantallas del Stack
      }}>
      
        <Stack.Screen name="(login)" options={{ headerShown: false }}/>
        <Stack.Screen name='(tabs)' options={{ headerShown: true }}/>
      </Stack>
    </SafeAreaProvider>
  )
}
