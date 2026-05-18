import { useLocalSearchParams, router } from 'expo-router'
import MovimientoScreen from '@/src/inventario/screens/MovimientoScreen'
import { TipoMovimiento } from '@hormigas/application'

export default function MovimientoRoute() {
  const params = useLocalSearchParams<{
    sucursalId: string
    inventarioId: string
    productoId: string
    productoNombre: string
    tipoPreseleccionado?: string
  }>()

  return (
    <MovimientoScreen
      sucursalId={Number(params.sucursalId)}
      inventarioId={Number(params.inventarioId)}
      productoId={Number(params.productoId)}
      productoNombre={params.productoNombre ?? ''}
      tipoPreseleccionado={params.tipoPreseleccionado as TipoMovimiento | undefined}
      onSuccess={() => router.back()}
    />
  )
}
