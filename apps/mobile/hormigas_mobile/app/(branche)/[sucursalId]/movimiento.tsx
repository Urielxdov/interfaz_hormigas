import { useLocalSearchParams, router } from 'expo-router'
import type { TipoMovimiento } from '@hormigas/application'
import MovimientoScreen from '@/src/inventario/screens/MovimientoScreen'

export default function MovimientoRoute() {
  const params = useLocalSearchParams<{
    sucursalId: string
    inventarioId: string
    productoNombre: string
    tipoPreseleccionado?: string
  }>()

  return (
    <MovimientoScreen
      sucursalId={Number(params.sucursalId)}
      inventarioId={Number(params.inventarioId)}
      productoNombre={params.productoNombre ?? ''}
      tipoPreseleccionado={params.tipoPreseleccionado as Extract<TipoMovimiento, 'COMPRA' | 'VENTA'> | undefined}
      onSuccess={() => router.back()}
    />
  )
}
