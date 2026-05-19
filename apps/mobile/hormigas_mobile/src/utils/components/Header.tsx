import { Text, View } from 'react-native'
import { Package, Wifi } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useIsTablet from '../hooks/useIsTablet'
import { useNetwork } from '../../../../shared/context/NetworkContext'
import SyncQueueBadge from './SyncQueueBadge'
import ThemeToggle from './ThemeToggle'

export default function Header () {
  const isTablet = useIsTablet()
  const insets = useSafeAreaInsets()
  const { isOnline } = useNetwork()

  return (
    <View
      className='p-4 border-b bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800'
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className='flex-row items-center'>
        <View className={`bg-indigo-500 rounded-xl ${isTablet ? 'p-4' : 'p-1'}`}>
          <Package size={isTablet ? 70 : 40} color='white' />
        </View>
        <View className='flex-1 ml-2'>
          <Text className={`font-sans-bold text-zinc-900 dark:text-zinc-50 overflow-visible ${isTablet ? 'text-4xl' : 'text-2xl'}`}>
            Sistema de Inventarios
          </Text>
          <Text className={`font-sans text-zinc-500 dark:text-zinc-400 ${isTablet ? 'text-lg' : 'text-sm'}`}>
            Panel de administración
          </Text>
        </View>
        <View className='flex-row items-center gap-2'>
          <SyncQueueBadge />
          <Wifi color={isOnline ? '#10b981' : '#ef4444'} />
          <ThemeToggle />
        </View>
      </View>
    </View>
  )
}
