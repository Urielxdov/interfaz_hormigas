import AlertCard from '@/src/utils/components/AlertCard'
import Header from '@/src/utils/components/Header'
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
import { FlatList, Text, View, useWindowDimensions } from 'react-native'
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

export default function DefaultInventaryScreen () {
  const { width } = useWindowDimensions()
  const numColumns = Math.floor(width / (CARD_MAX_WIDTH + CARD_GAP))

  return (
    <SafeAreaView className='flex-1' edges={['top']}>
      <View className='flex-1 flex-col gap-2'>
        <Header />
        <FlatList
          data={cards}
          numColumns={numColumns}
          key={numColumns} // importante: fuerza re-render al cambiar columnas
          keyExtractor={item => item.title}
          contentContainerStyle={{ gap: 16, padding: 16 }}
          columnWrapperStyle={numColumns > 1 ? { gap: 16 } : undefined}
          renderItem={({ item }) => <InformationCard {...item} />}
          style={{ flexGrow: 0 }}
        />

        <AlertCard
          title='Stock critico detectado'
          description='15 productos están por debajo del mínimo requerido'
          icon={AlertOctagon}
          color='orange'
        />

        <AlertCard
          title='Reabastecimiento completado'
          description='Sucursal Centro - 45 productos ingresados exitosamente'
          icon={CheckCircle2}
          color='green'
        />
        <AlertCard
          title='Actualizacion pendiente'
          description='Revisar inventario de Sucursal Norte Programado para hoy'
          icon={BellRing}
          color='blue'
        />
      </View>
    </SafeAreaView>
  )
}
