import { View, Text } from 'react-native'
import { MovimientoDTO } from '@hormigas/application'
import StockLineChart from './StockLineChart'
import MovimientosBarChart from './MovimientosBarChart'
import TrendBadge from './TrendBadge'
import { computeLineData, computeBarData, computeTrend } from '../utils/chartHelpers'

interface BranchProductCardProps {
  sucursalNombre: string
  movimientos: MovimientoDTO[]
}

export default function BranchProductCard({ sucursalNombre, movimientos }: BranchProductCardProps) {
  const lineData = computeLineData(movimientos)
  const barData = computeBarData(movimientos)
  const trendPercent = computeTrend(movimientos)
  const stockActual = lineData.length > 0 ? lineData[lineData.length - 1].value : null

  return (
    <View className='bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 overflow-hidden mb-4'>
      {/* Header */}
      <View className='px-4 pt-4 pb-3 flex-row items-start justify-between gap-2'>
        <View className='flex-1'>
          <Text
            className='font-sans-bold text-zinc-900 dark:text-zinc-50 text-base'
            numberOfLines={1}
          >
            {sucursalNombre}
          </Text>
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs mt-0.5'>
            {movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''}
            {stockActual !== null ? `  •  Stock: ${stockActual} uds` : ''}
          </Text>
        </View>
        <TrendBadge percent={trendPercent} />
      </View>

      {/* Stock line chart */}
      <View className='border-t border-stone-50 dark:border-zinc-800 px-4 pt-3 pb-2'>
        <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs mb-3 uppercase tracking-wide'>
          Stock a lo largo del tiempo
        </Text>
        <StockLineChart data={lineData} />
      </View>

      {/* Bar chart */}
      <View className='border-t border-stone-50 dark:border-zinc-800 px-4 pt-3 pb-4'>
        <View className='flex-row items-center gap-3 mb-3'>
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide'>
            Entradas y salidas por día
          </Text>
          <View className='flex-row gap-2'>
            <View className='flex-row items-center gap-1'>
              <View className='w-2 h-2 rounded-full bg-green-500' />
              <Text className='font-sans text-zinc-400 text-xs'>Entrada</Text>
            </View>
            <View className='flex-row items-center gap-1'>
              <View className='w-2 h-2 rounded-full bg-red-500' />
              <Text className='font-sans text-zinc-400 text-xs'>Salida</Text>
            </View>
          </View>
        </View>
        <MovimientosBarChart data={barData} />
      </View>
    </View>
  )
}
