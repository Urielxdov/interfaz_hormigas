import { View, Text, useColorScheme } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import {
  DailyTotals,
  CHART_SIDE_SPACING,
  Y_AXIS_LABEL_WIDTH,
  chartAreaWidth,
  computeBarLayout,
  computeYAxis,
  formatYLabel,
} from '../utils/chartHelpers'

interface MovimientosBarChartProps {
  data: DailyTotals[]
  /** Ancho medido del contenedor (onLayout). */
  containerWidth: number
}

export default function MovimientosBarChart({ data, containerWidth }: MovimientosBarChartProps) {
  const isDark = useColorScheme() === 'dark'

  const axisColor = isDark ? '#3f3f46' : '#e4e4e7'
  const labelColor = isDark ? '#71717a' : '#a1a1aa'

  if (data.length === 0) {
    return (
      <View className='items-center py-6'>
        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-sm'>Sin movimientos</Text>
      </View>
    )
  }

  // Sin medida todavía: no renderizar para evitar desbordes.
  if (containerWidth <= 0) return <View style={{ height: 200 }} />

  const chartWidth = chartAreaWidth(containerWidth)
  const xLabelStyle = { color: labelColor, fontSize: 9, fontFamily: 'Inter_400Regular' }
  const layout = computeBarLayout(data, chartWidth)
  const barWidth = layout.barWidth
  // labelTextStyle por barra reemplaza a xAxisLabelTextStyle: se le agrega color y tamaño.
  const bars = layout.data.map(b => b.labelTextStyle ? { ...b, labelTextStyle: { ...xLabelStyle, ...b.labelTextStyle } } : b)
  const yAxis = computeYAxis(data.flatMap(d => [d.entradas, d.salidas]))

  return (
    <BarChart
      data={bars}
      barWidth={barWidth}
      roundedTop
      width={chartWidth}
      yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
      maxValue={yAxis.maxValue}
      stepValue={yAxis.stepValue}
      noOfSections={yAxis.noOfSections}
      formatYLabel={formatYLabel}
      yAxisTextStyle={{ color: labelColor, fontSize: 10, fontFamily: 'Inter_400Regular' }}
      xAxisLabelTextStyle={xLabelStyle}
      rulesColor={axisColor}
      yAxisColor={axisColor}
      xAxisColor={axisColor}
      initialSpacing={CHART_SIDE_SPACING}
      endSpacing={CHART_SIDE_SPACING}
    />
  )
}
