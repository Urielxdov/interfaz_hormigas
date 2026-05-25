import { MovimientoDTO } from '@hormigas/application'

const TIPOS_SALIDA = new Set([
  'SALIDA', 'VENTA', 'MERMA', 'TRASLADO_SALIDA', 'DEVOLUCION_CLIENTE',
])

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })

export interface LineDataPoint {
  value: number
  label?: string
}

export interface BarDataPoint {
  value: number
  label: string
  frontColor: string
}

export function computeLineData(movimientos: MovimientoDTO[]): LineDataPoint[] {
  return movimientos
    .filter(m => m.stockNuevo !== undefined)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map(m => ({
      value: m.stockNuevo ?? 0,
      label: formatFecha(m.fecha),
    }))
}

export function computeBarData(movimientos: MovimientoDTO[]): BarDataPoint[] {
  const byDate = movimientos.reduce<Record<string, { entradas: number; salidas: number }>>(
    (acc, m) => {
      const date = m.fecha.slice(0, 10)
      if (!acc[date]) acc[date] = { entradas: 0, salidas: 0 }
      if (TIPOS_SALIDA.has(m.tipoMovimiento)) acc[date].salidas += m.cantidad
      else acc[date].entradas += m.cantidad
      return acc
    },
    {}
  )

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, { entradas, salidas }]) => {
      const label = formatFecha(date + 'T00:00:00')
      const result: BarDataPoint[] = []
      if (entradas > 0) result.push({ value: entradas, label, frontColor: '#059669' })
      if (salidas > 0) result.push({ value: salidas, label: entradas > 0 ? '' : label, frontColor: '#dc2626' })
      return result
    })
}

export function computeTrend(movimientos: MovimientoDTO[]): number | null {
  const now = new Date()
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - now.getDay())
  startOfThisWeek.setHours(0, 0, 0, 0)
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

  const thisWeek = movimientos.filter(m => new Date(m.fecha) >= startOfThisWeek).length
  const lastWeek = movimientos.filter(m => {
    const d = new Date(m.fecha)
    return d >= startOfLastWeek && d < startOfThisWeek
  }).length

  if (lastWeek === 0) return null
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
}
