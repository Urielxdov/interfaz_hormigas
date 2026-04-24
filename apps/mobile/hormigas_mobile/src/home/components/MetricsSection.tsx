import AlertCard from '@/src/utils/components/AlertCard'
import InformationCard from '@/src/utils/components/InformationCard'
import { Color } from '@/src/utils/constants/Colors'
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle2,
  LucideIcon,
  Package,
} from 'lucide-react-native'
import { FlatList, Text, useWindowDimensions, View } from 'react-native'
import { DashboardData } from '../hooks/useDashboard'

const CARD_MAX_WIDTH = 250
const CARD_GAP = 16

type Props = { dashboard: DashboardData }

export default function MetricsSection({ dashboard }: Props) {
  const { totalProductos, totalSucursales, totalAlertas, lowStockItems, isLoading } = dashboard
  const { width } = useWindowDimensions()
  const numColumns = Math.max(1, Math.floor(width / (CARD_MAX_WIDTH + CARD_GAP)))

  const cards: { title: string; description: string; icon: LucideIcon; iconBgColor: Color }[] = [
    { title: 'Total Productos', description: isLoading ? '…' : String(totalProductos), icon: Package, iconBgColor: 'blue' },
    { title: 'Sucursales', description: isLoading ? '…' : String(totalSucursales), icon: Building2, iconBgColor: 'green' },
    { title: 'Alertas Stock', description: isLoading ? '…' : String(totalAlertas), icon: AlertTriangle, iconBgColor: 'yellow' },
  ]

  const alerts = lowStockItems.slice(0, 5).map(item => ({
    title: `Stock bajo: ${item.nombre}`,
    description: `${item.stockActual} unidades (mínimo: ${item.stockMinimo})`,
    icon: AlertOctagon,
    color: 'orange' as Color,
  }))

  return (
    <View style={{ gap: 16 }}>
      <FlatList
        data={cards}
        numColumns={numColumns}
        key={numColumns}
        keyExtractor={item => item.title}
        contentContainerStyle={{ gap: 16 }}
        columnWrapperStyle={numColumns > 1 ? { gap: 16 } : undefined}
        renderItem={({ item }) => <InformationCard {...item} />}
        scrollEnabled={false}
      />

      {alerts.length > 0 && (
        <FlatList
          data={alerts}
          keyExtractor={item => item.title}
          contentContainerStyle={{ gap: 16 }}
          renderItem={({ item }) => <AlertCard {...item} />}
          scrollEnabled={false}
        />
      )}

      {alerts.length === 0 && !isLoading && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 }}>
          <CheckCircle2 size={18} color='#10b981' />
          <Text style={{ color: '#6b7280', fontSize: 14 }}>Sin alertas de stock</Text>
        </View>
      )}
    </View>
  )
}
