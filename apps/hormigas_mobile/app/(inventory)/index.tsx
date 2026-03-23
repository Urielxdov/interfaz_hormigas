import AlertCard from '@/src/utils/components/AlertCard'
import DataTable from '@/src/utils/components/DataTable'
import InformationCard from '@/src/utils/components/InformationCard'
import { ProductCardProps } from '@/src/utils/components/product/ProductCard'
import ProductList from '@/src/utils/components/product/ProductList'
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
import { FlatList, ScrollView, Text, View, useWindowDimensions } from 'react-native'
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

const lowStockProducts: ProductCardProps[] = [
  {
    name: 'Laptop HP ProBook 450',
    sku: 'LAP-HP-450',
    location: 'Centro',
    category: 'Electrónica',
    stock: 3,
    maxStock: 100,
    status: 'Bajo'
  },
  {
    name: 'Laptop HP ProBook 450',
    sku: 'LAP-HP-450-2',
    location: 'Centro',
    category: 'Electrónica',
    stock: 3,
    maxStock: 100,
    status: 'Bajo'
  }
]

const sucursales = [
  {
    nombre: 'Centro',
    totalProductos: 847,
    stockBajo: 8,
    valorInventario: '$1,245,800',
    movimiento: '+12.5%',
    estado: 'Óptimo'
  },
  {
    nombre: 'Norte',
    totalProductos: 623,
    stockBajo: 5,
    valorInventario: '$892,400',
    movimiento: '+8.3%',
    estado: 'Óptimo'
  },
  {
    nombre: 'Sur',
    totalProductos: 456,
    stockBajo: 12,
    valorInventario: '$645,200',
    movimiento: '+5.1%',
    estado: 'Atención'
  },
  {
    nombre: 'Este',
    totalProductos: 534,
    stockBajo: 3,
    valorInventario: '$756,900',
    movimiento: '+15.2%',
    estado: 'Óptimo'
  },
  {
    nombre: 'Oeste',
    totalProductos: 387,
    stockBajo: 7,
    valorInventario: '$534,500',
    movimiento: '+3.8%',
    estado: 'Óptimo'
  }
]

const getStatusColor = (estado: string | number): string => {
  const normalized = String(estado).toLowerCase()

  if (normalized === 'óptimo' || normalized === 'optimo') return 'bg-blue-200 text-blue-600'
  if (normalized === 'atención' || normalized === 'atencion') return 'bg-orange-200 text-orange-600'
  if (normalized === 'bajo') return 'bg-red-200 text-red-600'

  return 'text-gray-500'
}
export default function DefaultInventaryScreen () {
  const { width } = useWindowDimensions()
  const numColumns = Math.floor(width / (CARD_MAX_WIDTH + CARD_GAP))

  return (
    <SafeAreaView className='flex-1' edges={['top']}>
      <ScrollView contentContainerStyle={{ gap: 16, padding: 16}}>
        
        <FlatList
          data={cards}
          numColumns={numColumns}
          key={numColumns} // importante: fuerza re-render al cambiar columnas
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
          renderItem={({item}) => <AlertCard {...item}/>}
          scrollEnabled={false}
        />

        <ProductList
          title='Stock bajo'
          description='Productos que requieren reabastecimiento'
          icon={AlertTriangle}
          products={lowStockProducts}
        />

        <DataTable
          title="Resumen por Sucursal"
          description="Vista general del inventario en cada ubicación"
          icon={Building2}
          columns={[
            { key: 'nombre', label: 'Sucursal', render: (val => (
              <View className='flex flex-row items-center gap-1'>
                <View className='bg-blue-100 p-1 rounded-xl'>
                  <Building2 size={24} color='#1d4ed8'/>
                </View>
                <Text>{val}</Text>
              </View>
            ))},
            { key: 'totalProductos', label: 'Total Productos' },
            { key: 'stockBajo', label: 'Stock Bajo' },
            { key: 'valorInventario', label: 'Valor inventario'},
            { key: 'movimiento', label: 'movimiento'},
            { key: 'estado', label: 'Estado', render: (val) => (
              <View>
                <Text className={`${getStatusColor(val)} font-semibold rounded-xl p-1 text-center`}>
                  {val}
                </Text>
              </View>
            ) }
          ]}
          data={sucursales}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
