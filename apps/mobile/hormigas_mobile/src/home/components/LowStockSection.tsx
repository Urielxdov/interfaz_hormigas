import { ProductCardProps } from '@/src/utils/components/product/ProductCard'
import ProductList from '@/src/utils/components/product/ProductList'
import { AlertTriangle } from 'lucide-react-native'
import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const lowStockProducts: ProductCardProps[] = [
  {
    name: 'Laptop HP ProBook 450',
    sku: 'LAP-HP-450',
    location: 'Centro',
    category: 'Electronica',
    stock: 3,
    maxStock: 100,
    status: 'Bajo'
  },
  {
    name: 'Laptop HP ProBook 450',
    sku: 'LAP-HP-450-2',
    location: 'Centro',
    category: 'Electronica',
    stock: 3,
    maxStock: 100,
    status: 'Bajo'
  }
]

export default function LowStockSection () {
  return (
    <SafeAreaView className='flex-1' edges={['top']}>
      <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
        <ProductList
          title='Stock bajo'
          description='Productos que requieren reabastecimiento'
          icon={AlertTriangle}
          products={lowStockProducts}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
