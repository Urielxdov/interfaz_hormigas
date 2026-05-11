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
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 px-5 pt-14 pb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">Inicio</Text>
        <TouchableOpacity onPress={handleLogout} className="p-2">
          <LogOut size={20} color="#6b7280" />
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