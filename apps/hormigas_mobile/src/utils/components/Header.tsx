import { Text, View } from 'react-native'
import { Package } from 'lucide-react-native'
import useIsTablet from '../hooks/useIsTablet'

export default function Header () {
  const isTablet = useIsTablet()
  return (
    <View className='p-4 border-b'>
      <View className='flex-row items-center'>
        <View className={`bg-blue-600 rounded-lg ${isTablet ? 'p-4' : 'p-2'}`}>
          <Package size={isTablet ? 70 : 40} color='white' />
        </View>
        <View className='flex-1 ml-2'>
          <Text
            className={`overflow-visible ${isTablet ? 'text-4xl' : 'text-2xl'}`}
          >
            Sistema de Inventarios
          </Text>
          <Text className={isTablet ? 'text-lg' : 'text-sm'}>
            Panel de administración
          </Text>
        </View>
      </View>
    </View>
  )
}
