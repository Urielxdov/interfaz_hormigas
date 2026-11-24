import { ActivityIndicator, View, Text } from 'react-native'
import { AlertTriangle, CheckCircle2 } from 'lucide-react-native'
import { InventarioLocalItem } from '@/src/adapters/inventarioApiInstance'
import { useBreakpoint } from '@/src/utils/hooks/useBreakpoint'

interface LowStockSectionProps {
  items: InventarioLocalItem[]
  loading: boolean
}

export default function LowStockSection({ items, loading }: LowStockSectionProps) {
  const isPhone = useBreakpoint() === 'phone'

  return (
    <View className='bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 gap-3'>
      <View className='flex-row items-center gap-2'>
        <AlertTriangle size={16} color='#f59e0b' />
        <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50 flex-1'>Stock bajo</Text>
        {items.length > 0 && (
          <Text className='font-sans text-xs text-zinc-400 dark:text-zinc-500'>{items.length} producto{items.length === 1 ? '' : 's'}</Text>
        )}
      </View>

      {loading && <ActivityIndicator />}

      {!loading && items.length === 0 && (
        <View className='flex-row items-center gap-2 py-2'>
          <CheckCircle2 size={16} color='#22c55e' />
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>Almacenes surtidos</Text>
        </View>
      )}

      {!loading && items.length > 0 && (
        <View style={isPhone ? undefined : { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {items.map(item => (
            <View
              key={`${item.productoId}-${item.sucursalId}`}
              style={isPhone ? undefined : { width: '48%' }}
              className='flex-row items-center justify-between border-b border-stone-100 dark:border-zinc-800 py-2'
            >
              <View className='flex-1'>
                <Text className='font-sans-medium text-zinc-800 dark:text-zinc-200 text-sm'>
                  {item.productoNombre}
                </Text>
                <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>
                  {item.sucursalNombre}
                </Text>
              </View>
              <View className={`${item.stockActual <= 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'} rounded-full px-2 py-0.5`}>
                <Text className={`font-sans-semibold text-xs ${item.stockActual <= 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {item.stockActual <= 0 ? 'Agotado' : `${item.stockActual} de mín. ${item.stockMinimo}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
