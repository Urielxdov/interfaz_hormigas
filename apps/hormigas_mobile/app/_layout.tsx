import 'react-native-reanimated'
import '../global.css'

import ProductHomeScreen from '@/src/product/screens/ProductHomeScreen'
import DefaultInventaryScreen from '@/app/(inventory)'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import InformationCard from '@/src/utils/components/InformationCard'
import Header from '@/src/utils/components/Header'
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
