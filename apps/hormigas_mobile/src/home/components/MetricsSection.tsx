import AlertCard from '@/src/utils/components/AlertCard'
import InformationCard from '@/src/utils/components/InformationCard'
import { Color } from '@/src/utils/constants/Colors'
import {
  AlertOctagon,
  AlertTriangle,
  BellRing,
  Building2,
  CheckCircle2,
  LucideIcon,
  Package,
  TrendingUp
} from 'lucide-react-native'
import { FlatList, ScrollView, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const CARD_MAX_WIDTH = 250
const CARD_GAP = 16

const cards: {
  title: string
  description: string
  icon: LucideIcon
  iconBgColor: Color
}[] = [
  {
    title: 'Total Productos',
    description: '2,847',
    icon: Package,
    iconBgColor: 'blue'
  },
  {
    title: 'Sucursales',
    description: '8',
    icon: Building2,
    iconBgColor: 'green'
  },
  {
    title: 'Tendencia',
    description: '+12%',
    icon: TrendingUp,
    iconBgColor: 'purple'
  },
  {
    title: 'Alertas',
    description: '3',
    icon: AlertTriangle,
    iconBgColor: 'yellow'
  }
]

const alerts: {
  title: string
  description: string
  icon: LucideIcon
  color: Color
}[] = [
  {
    title: 'Stock critico detectad',
    description: '15 productos estan por debajo del minimo requerido',
    icon: AlertOctagon,
    color: 'orange'
  },
  {
    title: 'Reabastecimiento completado',
    description: 'Sucursal Centro - 45 productos ingresados exitosamente',
    icon: CheckCircle2,
    color: 'green'
  },
  {
    title: 'Actualizacion pendiente',
    description: 'Revisar inventario de Sucursal Norte programado para hoy',
    icon: BellRing,
    color: 'blue'
  }
]

export default function MetricsSection () {
  const { width } = useWindowDimensions()
  const numColumns = Math.floor(width / (CARD_MAX_WIDTH + CARD_GAP))

  return (
    <SafeAreaView className='flex-1' edges={['top']}>
      <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
        <FlatList
          data={cards}
          numColumns={numColumns}
          key={numColumns}
          keyExtractor={item => item.title}
          contentContainerStyle={{ gap: 16, padding: 16 }}
          columnWrapperStyle={numColumns > 1 ? { gap: 16 } : undefined}
          renderItem={({ item }) => <InformationCard {...item} />}
          scrollEnabled={false}
        />

        <FlatList
          data={alerts}
          keyExtractor={item => item.title}
          contentContainerStyle={{ gap: 16 }}
          renderItem={({ item }) => <AlertCard {...item} />}
          scrollEnabled={false}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
