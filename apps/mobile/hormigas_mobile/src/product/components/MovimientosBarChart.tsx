import { View, Text, useWindowDimensions, useColorScheme } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import { BarDataPoint } from '../utils/chartHelpers'

interface MovimientosBarChartProps {
  data: BarDataPoint[]
}

export default function MovimientosBarChart({ data }: MovimientosBarChartProps) {
  const { width } = useWindowDimensions()
  const isDark = useColorScheme() === 'dark'
  const chartWidth = width - 96

  const axisColor = isDark ? '#3f3f46' : '#e4e4e7'
  const labelColor = isDark ? '#71717a' : '#a1a1aa'

  if (data.length === 0) {
    return (
      <View className='items-center py-6'>
        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-sm'>Sin movimientos</Text>
      </View>
    )
  }

  const barWidth = Math.max(10, Math.min(26, (chartWidth / Math.max(data.length, 1)) - 8))
  const spacing = Math.max(4, barWidth * 0.25)

  return (
    <BarChart
      data={data}
      barWidth={barWidth}
      spacing={spacing}
      roundedTop
      width={chartWidth}
      yAxisTextStyle={{ color: labelColor, fontSize: 10, fontFamily: 'Inter_400Regular' }}
      xAxisLabelTextStyle={{ color: labelColor, fontSize: 9, fontFamily: 'Inter_400Regular' }}
      rulesColor={axisColor}
      yAxisColor={axisColor}
      xAxisColor={axisColor}
      noOfSections={4}
      initialSpacing={8}
      endSpacing={8}
    />
  )
}
