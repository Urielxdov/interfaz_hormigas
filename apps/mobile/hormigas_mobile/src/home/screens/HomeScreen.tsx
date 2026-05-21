import MetricsSection from '@/src/home/components/MetricsSection'
import LowStockSection from '@/src/home/components/LowStockSection'
import BranchSummaryScreen from '../components/BranchSummaryScreen'
import { useAuth } from '@/src/login/hooks/useAuth'
import { useProducts } from '@/src/utils/hooks/useProducts'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { useSyncQueueStatus } from '@/src/utils/hooks/useSyncQueueStatus'
import { useInventario } from '@/src/utils/hooks/useInventario'
import { useSyncManager } from '@/src/utils/hooks/useSyncManager'
import { router } from 'expo-router'
import { LogOut, RefreshCw, CheckCircle } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

export default function HomeScreen() {
  const { logout } = useAuth()
  const { products } = useProducts()
  const { branches } = useBranches()
  const { pendingCount } = useSyncQueueStatus()
  const { lowStockItems, loading: loadingStock, refresh: refreshStock } = useInventario()
  const { isSyncing, lastSync, triggerSync } = useSyncManager()
  const [syncedMsg, setSyncedMsg] = useState(false)

  useFocusEffect(useCallback(() => { refreshStock() }, [refreshStock]))

  const handleLogout = async () => {
    await logout()
    router.replace('/(login)')
  }

  const handleSyncPress = async () => {
    if (pendingCount === 0 && !isSyncing) {
      setSyncedMsg(true)
      setTimeout(() => setSyncedMsg(false), 3000)
      return
    }
    triggerSync()
  }

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      <View className='bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 flex-row items-center justify-between'>
        <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Inicio</Text>
        <View className='flex-row items-center gap-3'>
          <TouchableOpacity
            onPress={handleSyncPress}
            disabled={isSyncing}
            className='flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-zinc-800'
          >
            {isSyncing ? (
              <ActivityIndicator size='small' color='#6366f1' />
            ) : syncedMsg ? (
              <CheckCircle size={16} color='#059669' />
            ) : (
              <RefreshCw size={16} color={pendingCount > 0 ? '#6366f1' : '#71717a'} />
            )}
            <Text className={`text-xs font-sans-medium ${
              syncedMsg ? 'text-green-600' :
              pendingCount > 0 ? 'text-indigo-600 dark:text-indigo-400' :
              'text-zinc-500 dark:text-zinc-400'
            }`}>
              {isSyncing ? 'Sincronizando...' :
               syncedMsg ? 'Sincronizado' :
               pendingCount > 0 ? `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}` :
               'Sincronizar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} className='p-2'>
            <LogOut size={20} color='#71717a' />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
        <MetricsSection
          totalProductos={products.filter(p => p.estado).length}
          totalSucursales={branches.filter(b => b.activa).length}
          pendienteSync={pendingCount}
        />
        <LowStockSection items={lowStockItems} loading={loadingStock} />
        <BranchSummaryScreen branches={branches} />
      </ScrollView>
    </View>
  )
}
