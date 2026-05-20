import { useLocalSearchParams } from 'expo-router'
import InventarioScreen from '@/src/inventario/screens/InventarioScreen'

export default function InventarioRoute() {
  const { sucursalId, sucursalNombre } = useLocalSearchParams<{
    sucursalId: string
    sucursalNombre: string
  }>()

  return (
    <InventarioScreen
      sucursalId={Number(sucursalId)}
      sucursalNombre={sucursalNombre ?? ''}
    />
  )
}
