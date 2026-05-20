import { ActivityIndicator, View, Text } from 'react-native'
import { AlertTriangle, CheckCircle2 } from 'lucide-react-native'
import { InventarioLocalItem } from '@/src/adapters/inventarioApiInstance'

interface LowStockSectionProps {
  items: InventarioLocalItem[]
  loading: boolean
}

export default function LowStockSection({ items, loading }: LowStockSectionProps) {
  return (
    <View className='bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 gap-3'>
      <View className='flex-row items-center gap-2'>
        <AlertTriangle size={16} color='#f59e0b' />
        <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>Stock bajo</Text>
      </View>

      {loading && <ActivityIndicator />}

      {!loading && items.length === 0 && (
        <View className='flex-row items-center gap-2 py-2'>
          <CheckCircle2 size={16} color='#22c55e' />
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>Almacenes surtidos</Text>
        </View>
      )}

      {!loading && items.map(item => (
        <View
          key={`${item.productoId}-${item.sucursalId}`}
          className='flex-row items-center justify-between border-b border-stone-50 dark:border-zinc-800 pb-2'
        >
          <View className='flex-1'>
            <Text className='font-sans-medium text-zinc-800 dark:text-zinc-200 text-sm'>
              {item.productoNombre}
            </Text>
            <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>
              {item.sucursalNombre}
            </Text>
          </View>
          <View className='bg-red-100 dark:bg-red-900/30 rounded-full px-2 py-0.5'>
            <Text className='font-sans-semibold text-red-700 dark:text-red-400 text-xs'>
              {item.stockActual} / {item.stockMinimo}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}
