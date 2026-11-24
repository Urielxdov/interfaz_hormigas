import type { TipoMovimiento } from '../use-cases/movimiento/movimiento.dto'

/** Tipos que restan stock (signo -1 en el backend). AJUSTE se trata aparte. */
const SALIDAS = new Set<string>(['VENTA', 'MERMA', 'TRASLADO_SALIDA', 'DEVOLUCION_PROVEEDOR', 'SALIDA'])
/** Tipos que suman stock (signo +1 en el backend). */
const ENTRADAS = new Set<string>(['COMPRA', 'DEVOLUCION', 'DEVOLUCION_CLIENTE', 'TRASLADO_ENTRADA', 'ENTRADA'])

export const esMovimientoSalida = (tipo: string): boolean => SALIDAS.has(tipo)
export const esMovimientoEntrada = (tipo: string): boolean => ENTRADAS.has(tipo)

/** Tipos que la pantalla de movimiento manual puede registrar (los acepta POST /api/movimiento/crear). */
export const TIPOS_MANUALES: { tipo: TipoMovimiento; label: string; entrada: boolean }[] = [
    { tipo: 'COMPRA', label: 'Compra a proveedor', entrada: true },
    { tipo: 'DEVOLUCION', label: 'Devolución de cliente', entrada: true },
    { tipo: 'MERMA', label: 'Merma / daño', entrada: false },
    { tipo: 'VENTA', label: 'Venta fuera del POS', entrada: false },
]
