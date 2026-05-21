import { useInventarioSucursal } from '@/src/utils/hooks/useInventarioSucursal'
import { useMovimientos } from '@/src/movimientos/hooks/useMovimientos'
import { router } from 'expo-router'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Box,
  CheckCircle2,
  Package,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  sucursalId: number
  sucursalNombre: string
}

const formatFecha = (fecha: string) => {
  try {
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  } catch {
    return fecha
  }
}

export default function BranchDetailScreen({ sucursalId, sucursalNombre }: Props) {
  const { movimientos, loading: loadingMov } = useMovimientos(sucursalId)
  const { items: inventario, loading: loadingInv } = useInventarioSucursal(sucursalId)

  const entradas = movimientos.filter(m => m.tipoMovimiento === 'ENTRADA').length
  const salidas = movimientos.filter(m => m.tipoMovimiento === 'SALIDA').length
  const lowStock = inventario.filter(i => i.stockActual <= i.stockMinimo)
  const recentMovs = movimientos.slice(0, 10)

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      <View className='bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 flex-row items-center gap-3'>
        <TouchableOpacity onPress={() => router.back()} className='p-2 -ml-2 rounded-xl'>
          <ArrowLeft size={20} color='#71717a' />
        </TouchableOpacity>
        <View className='flex-1'>
          <Text className='font-sans-bold text-xl text-zinc-900 dark:text-zinc-50' numberOfLines={1}>
            {sucursalNombre}
          </Text>
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs'>Detalle de sucursal</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
        {/* Stats */}
        <View className='flex-row gap-3'>
          <View className='flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 items-center gap-1.5'>
            <View className='bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl'>
              <Package size={16} color='#6366f1' />
            </View>
            <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>{inventario.length}</Text>
            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs text-center'>Inventarios</Text>
          </View>
          <View className='flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 items-center gap-1.5'>
            <View className='bg-green-100 dark:bg-green-900/30 p-2 rounded-xl'>
              <TrendingUp size={16} color='#059669' />
            </View>
            <Text className='font-sans-bold text-2xl text-green-700 dark:text-green-400'>{entradas}</Text>
            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs text-center'>Entradas</Text>
          </View>
          <View className='flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 items-center gap-1.5'>
            <View className='bg-red-100 dark:bg-red-900/30 p-2 rounded-xl'>
              <TrendingDown size={16} color='#dc2626' />
            </View>
            <Text className='font-sans-bold text-2xl text-red-700 dark:text-red-400'>{salidas}</Text>
            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs text-center'>Salidas</Text>
          </View>
        </View>

        {/* Low stock */}
        <View className='bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 gap-3'>
          <View className='flex-row items-center gap-2'>
            <AlertTriangle size={15} color='#f59e0b' />
            <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>Stock bajo</Text>
          </View>
          {loadingInv && <ActivityIndicator color='#6366f1' size='small' />}
          {!loadingInv && lowStock.length === 0 && (
            <View className='flex-row items-center gap-2 py-1'>
              <CheckCircle2 size={14} color='#22c55e' />
              <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>Almacén surtido</Text>
            </View>
          )}
          {lowStock.map(item => (
            <View
              key={item.id}
              className='flex-row items-center justify-between pb-2 border-b border-stone-50 dark:border-zinc-800'
            >
              <Text className='font-sans-medium text-zinc-800 dark:text-zinc-200 text-sm flex-1' numberOfLines={1}>
                {item.productoNombre}
              </Text>
              <View className='bg-red-100 dark:bg-red-900/30 rounded-full px-2 py-0.5 ml-2'>
                <Text className='font-sans-semibold text-red-700 dark:text-red-400 text-xs'>
                  {item.stockActual} / {item.stockMinimo}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent movements */}
        <View className='bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 gap-3'>
          <View className='flex-row items-center gap-2'>
            <Activity size={15} color='#6366f1' />
            <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>Movimientos recientes</Text>
          </View>
          {loadingMov && <ActivityIndicator color='#6366f1' size='small' />}
          {!loadingMov && recentMovs.length === 0 && (
            <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-sm py-1'>
              Sin movimientos registrados
            </Text>
          )}
          {recentMovs.map(m => (
            <View
              key={m.id}
              className='flex-row items-center justify-between pb-2 border-b border-stone-50 dark:border-zinc-800'
            >
              <View className='flex-1 gap-0.5'>
                <Text className='font-sans-medium text-zinc-800 dark:text-zinc-200 text-sm' numberOfLines={1}>
                  {m.productoNombre}
                </Text>
                <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>{formatFecha(m.fecha)}</Text>
              </View>
              <View
                className={`ml-2 px-2.5 py-0.5 rounded-full ${
                  m.tipoMovimiento === 'ENTRADA' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    m.tipoMovimiento === 'ENTRADA'
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {m.tipoMovimiento === 'ENTRADA' ? `+${m.cantidad}` : `-${m.cantidad}`}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Full inventory */}
        <View className='bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 gap-3'>
          <View className='flex-row items-center gap-2'>
            <Box size={15} color='#6366f1' />
            <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>
              Inventario{inventario.length > 0 ? ` (${inventario.length})` : ''}
            </Text>
          </View>
          {loadingInv && <ActivityIndicator color='#6366f1' size='small' />}
          {!loadingInv && inventario.length === 0 && (
            <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-sm'>Sin inventario registrado</Text>
          )}
          {inventario.map(item => (
            <View
              key={item.id}
              className='flex-row items-center justify-between pb-2 border-b border-stone-50 dark:border-zinc-800'
            >
              <Text
                className='font-sans-medium text-zinc-800 dark:text-zinc-200 text-sm flex-1'
                numberOfLines={1}
              >
                {item.productoNombre}
              </Text>
              <View className='flex-row items-center gap-1 ml-2'>
                <Text className='font-sans-bold text-zinc-700 dark:text-zinc-300 text-sm'>{item.stockActual}</Text>
                <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>/ {item.stockMaximo}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
