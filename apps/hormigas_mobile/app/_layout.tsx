import 'react-native-reanimated'
import '../global.css'

import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Slot } from 'expo-router'

export const unstable_settings = {
  anchor: '(tabs)'
}

export default function RootLayout () {
  return (
    <SafeAreaProvider>
      <Slot/>
      {/* <InformationCard /> */}
    </SafeAreaProvider>
  )
}
