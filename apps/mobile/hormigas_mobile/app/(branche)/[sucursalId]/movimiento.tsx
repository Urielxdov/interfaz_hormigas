import { useLocalSearchParams, router } from 'expo-router'
import type { TipoMovimiento } from '@hormigas/application'
import MovimientoScreen from '@/src/inventario/screens/MovimientoScreen'

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
      tipoPreseleccionado={params.tipoPreseleccionado as Extract<TipoMovimiento, 'ENTRADA' | 'SALIDA'> | undefined}
      onSuccess={() => router.back()}
    />
  )
}
