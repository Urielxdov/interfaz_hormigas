import 'react-native-reanimated'
import '../global.css'

import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import Header from '@/src/utils/components/Header'

export const unstable_settings = {
  anchor: '(tabs)'
}

export default function RootLayout () {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ 
        header: () => <Header/>  // ← aquí, aplica a todas las pantallas del Stack
      }}/>
    </SafeAreaProvider>
  )
}
