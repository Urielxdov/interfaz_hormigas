import { useLocalSearchParams, router } from 'expo-router'
import type { TipoMovimiento } from '@hormigas/application'
import MovimientoScreen from '@/src/inventario/screens/MovimientoScreen'

export default function MovimientoRoute() {
  const params = useLocalSearchParams<{
    sucursalId: string
    inventarioId: string
    productoId: string
    productoNombre: string
    stockActual?: string
    tipoPreseleccionado?: string
  }>()

  return (
    <MovimientoScreen
      sucursalId={Number(params.sucursalId)}
      inventarioId={Number(params.inventarioId)}
      productoId={Number(params.productoId)}
      productoNombre={params.productoNombre ?? ''}
      stockActual={params.stockActual !== undefined ? Number(params.stockActual) : undefined}
      tipoPreseleccionado={params.tipoPreseleccionado as Extract<TipoMovimiento, 'ENTRADA' | 'SALIDA'> | undefined}
      onSuccess={() => router.back()}
    />
  )
}
