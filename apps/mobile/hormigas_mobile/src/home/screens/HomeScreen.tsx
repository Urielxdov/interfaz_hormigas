import LowStockSection from '@/src/home/components/LowStockSection'
import MetricsSection from '@/src/home/components/MetricsSection'
import { useAuth } from '@/src/login/hooks/useAuth'
import { router } from 'expo-router'
import { LogOut } from 'lucide-react-native'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import BranchSummaryScreen from '../components/BranchSummaryScreen'

export default function HomeScreen () {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace('/(login)')
  }

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      <View className='bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 flex-row items-center justify-between'>
        <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Inicio</Text>
        <TouchableOpacity onPress={handleLogout} className='p-2'>
          <LogOut size={20} color='#71717a' />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
        <MetricsSection />
        <LowStockSection />
        <BranchSummaryScreen />
      </ScrollView>
    </View>
  )
}
