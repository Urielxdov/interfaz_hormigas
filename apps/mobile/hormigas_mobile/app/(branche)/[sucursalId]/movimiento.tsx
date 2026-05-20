import { useLocalSearchParams, router } from 'expo-router'
import MovimientoScreen from '@/src/inventario/screens/MovimientoScreen'

export default function MovimientoRoute() {
  const params = useLocalSearchParams<{
    sucursalId: string
    productoId: string
    productoNombre: string
    tipoPreseleccionado?: string
  }>()

  return (
    <MovimientoScreen
      sucursalId={Number(params.sucursalId)}
      productoId={Number(params.productoId)}
      productoNombre={params.productoNombre ?? ''}
      tipoPreseleccionado={params.tipoPreseleccionado as 'ENTRADA' | 'SALIDA' | undefined}
      onSuccess={() => router.back()}
    />
  )
}
