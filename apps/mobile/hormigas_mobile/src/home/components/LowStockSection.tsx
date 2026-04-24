import { ProductCardProps } from '@/src/utils/components/product/ProductCard'
import ProductList from '@/src/utils/components/product/ProductList'
import { AlertTriangle } from 'lucide-react-native'
import { DashboardData } from '../hooks/useDashboard'

type Props = { dashboard: DashboardData }

export default function LowStockSection({ dashboard }: Props) {
  const { lowStockItems, isLoading } = dashboard

  if (isLoading || lowStockItems.length === 0) return null

  const products: ProductCardProps[] = lowStockItems.map(item => ({
    name: item.nombre,
    sku: item.sku,
    location: `Sucursal ${item.sucursalId}`,
    category: item.categoria ?? '',
    stock: item.stockActual,
    maxStock: item.stockMinimo * 2,
    status: item.stockActual === 0 ? 'Crítico' : 'Bajo',
  }))

  return (
    <ProductList
      title='Stock bajo'
      description='Productos que requieren reabastecimiento'
      icon={AlertTriangle}
      products={products}
    />
  )
}
