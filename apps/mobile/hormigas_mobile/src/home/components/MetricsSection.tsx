import InformationCard from '@/src/utils/components/InformationCard'
import { useBreakpoint } from '@/src/utils/hooks/useBreakpoint'
import { AlertTriangle, Building2, Package, RefreshCw } from 'lucide-react-native'
import { router } from 'expo-router'
import { View, Text } from 'react-native'

interface MetricsSectionProps {
  totalProductos: number
  productosInactivos: number
  totalSucursales: number
  sucursalesInactivas: number
  stockBajo: number
  pendienteSync: number
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Resumen del panel: 2 columnas en telefono, 4 en tablet. */
export default function MetricsSection ({
  totalProductos,
  productosInactivos,
  totalSucursales,
  sucursalesInactivas,
  stockBajo,
  pendienteSync,
}: MetricsSectionProps) {
  const isPhone = useBreakpoint() === 'phone'

  const cards = [
    <InformationCard
      key='productos'
      title='Productos activos'
      description={String(totalProductos)}
      hint={productosInactivos > 0 ? plural(productosInactivos, 'inactivo', 'inactivos') : 'Catálogo completo'}
      icon={Package}
      iconBgColor='blue'
      onPress={() => router.push('/(tabs)/products')}
    />,
    <InformationCard
      key='sucursales'
      title='Sucursales activas'
      description={String(totalSucursales)}
      hint={sucursalesInactivas > 0 ? plural(sucursalesInactivas, 'inactiva', 'inactivas') : 'Todas operando'}
      icon={Building2}
      iconBgColor='green'
      onPress={() => router.push('/(tabs)/branche')}
    />,
    <InformationCard
      key='stock'
      title='Stock bajo'
      description={String(stockBajo)}
      hint={stockBajo > 0 ? 'Por debajo del mínimo' : 'Almacenes surtidos'}
      icon={AlertTriangle}
      iconBgColor={stockBajo > 0 ? 'red' : 'green'}
    />,
    <InformationCard
      key='sync'
      title='Sin sincronizar'
      description={String(pendienteSync)}
      hint={pendienteSync > 0 ? 'Se enviarán al haber conexión' : 'Todo al día'}
      icon={RefreshCw}
      iconBgColor={pendienteSync > 0 ? 'yellow' : 'indigo'}
    />,
  ]

  return (
    <View className='gap-3'>
      <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50 text-base'>Resumen</Text>
      {isPhone ? (
        <View className='gap-3'>
          <View className='flex-row gap-3'>{cards[0]}{cards[1]}</View>
          <View className='flex-row gap-3'>{cards[2]}{cards[3]}</View>
        </View>
      ) : (
        <View className='flex-row gap-3'>{cards}</View>
      )}
    </View>
  )
}
