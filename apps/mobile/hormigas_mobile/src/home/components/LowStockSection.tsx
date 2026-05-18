import ProductList from '@/src/utils/components/product/ProductList'
import { ProductCardProps } from '@/src/utils/components/product/ProductCard'
import { AlertTriangle } from 'lucide-react-native'
import { View, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { getInventarioRepos } from '@/src/adapters/inventarioServiceInstance'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

export default function LowStockSection() {
  const [products, setProducts] = useState<ProductCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const { isOnline } = useNetwork()

  useEffect(() => {
    const load = async () => {
      try {
        const { sqlite } = await getInventarioRepos()
        const lowStock = await sqlite.findLowStock()
        setProducts(
          lowStock.map(item => ({
            name: item.productoNombre,
            sku: String(item.productoId),
            location: item.sucursalNombre,
            category: '',
            stock: item.stockActual,
            maxStock: item.stockMaximo,
            status: item.stockActual === 0 ? 'Critico' : 'Bajo',
          }))
        )
      } catch (e) {
        console.warn('[LowStockSection]', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOnline])

  if (loading) {
    return (
      <View className="p-4 items-center">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ProductList
      title='Stock bajo'
      description='Productos que requieren reabastecimiento'
      icon={AlertTriangle}
      products={products}
    />
  )
}
