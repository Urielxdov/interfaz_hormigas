import { Text, View } from 'react-native'
import { Package, Wifi } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useIsTablet from '../hooks/useIsTablet'
import { useNetwork } from '../../../../shared/context/NetworkContext'

export default function Header () {
  const isTablet = useIsTablet()
  const insets = useSafeAreaInsets()
  const { isOnline } = useNetwork()

  return (
    <View 
      className='p-4 border-b'
      style={{ paddingTop: insets.top + 8 }}  // ← y esto (el +8 reemplaza el padding top del className)
    >
      <View className='flex-row items-center'>
        <View className={`bg-blue-600 rounded-lg ${isTablet ? 'p-4' : 'p-1'}`}>
          <Package size={isTablet ? 70 : 40} color='white' />
        </View>
        <View className='flex-1 ml-2'>
          <Text className={`overflow-visible ${isTablet ? 'text-4xl' : 'text-2xl'}`}>
            Sistema de Inventarios
          </Text>
          <Text className={isTablet ? 'text-lg' : 'text-sm'}>
            Panel de administración
          </Text>
          
        </View>
        <Wifi color={isOnline ? 'green' : 'red'}/>
      </View>
    </View>
  )
}