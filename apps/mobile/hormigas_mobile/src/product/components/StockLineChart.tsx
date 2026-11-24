import { View, Text, useColorScheme } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import {
  LineDataPoint,
  CHART_SIDE_SPACING,
  Y_AXIS_LABEL_WIDTH,
  chartAreaWidth,
  computeLineLayout,
  computeYAxis,
  formatYLabel,
} from '../utils/chartHelpers'

interface StockLineChartProps {
  data: LineDataPoint[]
  /** Ancho medido del contenedor (onLayout). */
  containerWidth: number
}

export default function StockLineChart({ data, containerWidth }: StockLineChartProps) {
  const isDark = useColorScheme() === 'dark'

  const axisColor = isDark ? '#3f3f46' : '#e4e4e7'
  const labelColor = isDark ? '#71717a' : '#a1a1aa'

  if (data.length === 0) {
    return (
      <View className='items-center py-6'>
        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-sm'>Sin datos de stock</Text>
      </View>
    )
  }

  // Sin medida todavía: no renderizar para evitar desbordes.
  if (containerWidth <= 0) return <View style={{ height: 200 }} />

  const chartWidth = chartAreaWidth(containerWidth)
  const { data: displayData, spacing, hideDataPoints } = computeLineLayout(data, chartWidth)
  const yAxis = computeYAxis(data.map(d => d.value))

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
      curved={data.length > 2}
      dataPointsColor='#6366f1'
      dataPointsRadius={4}
      hideDataPoints={hideDataPoints}
      width={chartWidth}
      spacing={spacing}
      yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
      maxValue={yAxis.maxValue}
      stepValue={yAxis.stepValue}
      noOfSections={yAxis.noOfSections}
      formatYLabel={formatYLabel}
      disableScroll
      yAxisTextStyle={{ color: labelColor, fontSize: 10, fontFamily: 'Inter_400Regular' }}
      xAxisLabelTextStyle={{ color: labelColor, fontSize: 9, fontFamily: 'Inter_400Regular' }}
      rulesColor={axisColor}
      yAxisColor={axisColor}
      xAxisColor={axisColor}
      initialSpacing={CHART_SIDE_SPACING}
      endSpacing={CHART_SIDE_SPACING}
    />
  )
}
