import { useLocalSearchParams } from 'expo-router'
import ProductDetailScreen from '@/src/product/screens/ProductDetailScreen'

export default function ProductDetailPage() {
  const { localId } = useLocalSearchParams<{ localId: string }>()
  return <ProductDetailScreen localId={localId} />
}
