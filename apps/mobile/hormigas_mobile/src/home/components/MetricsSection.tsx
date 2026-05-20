import InformationCard from '@/src/utils/components/InformationCard'
import { Building2, Package, RefreshCw } from 'lucide-react-native'
import { View, Text } from 'react-native'

interface MetricsSectionProps {
  totalProductos: number
  totalSucursales: number
  pendienteSync: number
}

export default function MetricsSection({ totalProductos, totalSucursales, pendienteSync }: MetricsSectionProps) {
  return (
    <View className='gap-3'>
      <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50 text-base'>Resumen</Text>
      <View className='flex-row gap-3'>
        <View className='flex-1'>
          <InformationCard
            title='Productos'
            description={String(totalProductos)}
            icon={Package}
            iconBgColor='blue'
          />
        </View>
        <View className='flex-1'>
          <InformationCard
            title='Sucursales'
            description={String(totalSucursales)}
            icon={Building2}
            iconBgColor='green'
          />
        </View>
      </View>
      <InformationCard
        title='Pendientes de sync'
        description={pendienteSync > 0 ? `${pendienteSync} movimiento(s)` : 'Todo sincronizado'}
        icon={RefreshCw}
        iconBgColor={pendienteSync > 0 ? 'yellow' : 'green'}
      />
    </View>
  )
}
