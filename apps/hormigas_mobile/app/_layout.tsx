import 'react-native-reanimated'
import '../global.css'

import ProductHomeScreen from '@/src/product/screens/ProductHomeScreen'
import DefaultInventaryScreen from '@/src/inventary/screens/DefaultInventaryScreen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import InformationCard from '@/src/utils/components/InformationCard'

export const unstable_settings = {
  anchor: '(tabs)'
}

export default function RootLayout () {
  return (
    <SafeAreaProvider>
      <DefaultInventaryScreen />
      {/* <InformationCard /> */}
    </SafeAreaProvider>
  )
}
