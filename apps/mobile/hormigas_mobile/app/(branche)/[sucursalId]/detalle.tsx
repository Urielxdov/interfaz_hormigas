import { useLocalSearchParams } from 'expo-router'
import BranchDetailScreen from '@/src/branches/screens/BranchDetailScreen'

export default function DetalleRoute() {
  const { sucursalId, sucursalNombre } = useLocalSearchParams<{
    sucursalId: string
    sucursalNombre: string
  }>()

  return (
    <BranchDetailScreen
      sucursalId={Number(sucursalId)}
      sucursalNombre={sucursalNombre ?? ''}
    />
  )
}
