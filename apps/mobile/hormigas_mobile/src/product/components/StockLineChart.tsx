import { View, Text, useWindowDimensions, useColorScheme } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { LineDataPoint } from '../utils/chartHelpers'

interface StockLineChartProps {
  data: LineDataPoint[]
}

export default function StockLineChart({ data }: StockLineChartProps) {
  const { width } = useWindowDimensions()
  const isDark = useColorScheme() === 'dark'
  const chartWidth = width - 96

  const axisColor = isDark ? '#3f3f46' : '#e4e4e7'
  const labelColor = isDark ? '#71717a' : '#a1a1aa'

  if (data.length === 0) {
    return (
      <View className='items-center py-6'>
        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-sm'>Sin datos de stock</Text>
      </View>
    )
  }

  const spacing = Math.max(32, Math.min(80, (chartWidth - 40) / Math.max(data.length - 1, 1)))
  const showAllLabels = data.length <= 8
  const displayData = showAllLabels
    ? data
    : data.map((d, i) => ({
        ...d,
        label: i % Math.ceil(data.length / 6) === 0 ? d.label : '',
      }))

  return (
    <LineChart
      data={displayData}
      color='#6366f1'
      thickness={2}
      areaChart
      startFillColor='#6366f1'
      endFillColor='#6366f1'
      startOpacity={0.18}
      endOpacity={0}
      curved
      dataPointsColor='#6366f1'
      dataPointsRadius={4}
      width={chartWidth}
      spacing={spacing}
      yAxisTextStyle={{ color: labelColor, fontSize: 10, fontFamily: 'Inter_400Regular' }}
      xAxisLabelTextStyle={{ color: labelColor, fontSize: 9, fontFamily: 'Inter_400Regular' }}
      rulesColor={axisColor}
      yAxisColor={axisColor}
      xAxisColor={axisColor}
      noOfSections={4}
      initialSpacing={12}
      endSpacing={12}
    />
  )
}
