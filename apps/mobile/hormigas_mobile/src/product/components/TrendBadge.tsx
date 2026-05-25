import { View, Text } from 'react-native'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native'

interface TrendBadgeProps {
  percent: number | null
}

export default function TrendBadge({ percent }: TrendBadgeProps) {
  if (percent === null) {
    return (
      <View className='flex-row items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1'>
        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>Sin datos sem.</Text>
      </View>
    )
  }

  if (percent > 0) {
    return (
      <View className='flex-row items-center gap-1 bg-green-100 dark:bg-green-900/30 rounded-full px-3 py-1'>
        <TrendingUp size={11} color='#059669' />
        <Text className='font-sans-semibold text-green-700 dark:text-green-400 text-xs'>
          ↑ {percent}% esta sem.
        </Text>
      </View>
    )
  }

  if (percent < 0) {
    return (
      <View className='flex-row items-center gap-1 bg-red-100 dark:bg-red-900/30 rounded-full px-3 py-1'>
        <TrendingDown size={11} color='#dc2626' />
        <Text className='font-sans-semibold text-red-700 dark:text-red-400 text-xs'>
          ↓ {Math.abs(percent)}% esta sem.
        </Text>
      </View>
    )
  }

  return (
    <View className='flex-row items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1'>
      <Minus size={11} color='#71717a' />
      <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs'>Sin cambio</Text>
    </View>
  )
}
