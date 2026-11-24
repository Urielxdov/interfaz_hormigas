import type { MovimientoDTO } from '@hormigas/application'

const TIPOS_SALIDA = new Set([
  'SALIDA', 'VENTA', 'MERMA', 'TRASLADO_SALIDA', 'DEVOLUCION_CLIENTE',
])

export const COLOR_ENTRADA = '#059669'
export const COLOR_SALIDA = '#dc2626'

/** Ancho fijo reservado para las etiquetas del eje Y (ambas gráficas). */
export const Y_AXIS_LABEL_WIDTH = 36
/** Espacio inicial + final dentro del área de la gráfica. */
export const CHART_SIDE_SPACING = 8
/** Ancho aproximado que ocupa una etiqueta "dd/MM" en el eje X. */
const X_LABEL_MIN_WIDTH = 40

export interface LineDataPoint {
  value: number
  label?: string
  /** Clave de día local (YYYY-MM-DD). */
  day: string
}

export interface BarDataPoint {
  value: number
  label?: string
  frontColor: string
  spacing?: number
  labelWidth?: number
  labelTextStyle?: { textAlign: 'center' }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * Parser único de fechas del backend. El backend envía LocalDateTime
 * ("2026-11-20T14:23:11.123456", sin zona y con microsegundos), que Hermes
 * no siempre interpreta con `new Date()`. Las fechas sin zona se interpretan
 * como hora local; si traen zona (Z / ±hh:mm) se respeta. Si nada funciona,
 * se usa la parte de fecha (slice(0,10)).
 */
export function parseFecha(fecha: string | null | undefined): Date | null {
  if (!fecha || typeof fecha !== 'string') return null
  const s = fecha.trim()
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?(Z|[+-]\d{2}:?\d{2})?$/
  )
  if (m) {
    const [, y, mo, d, h = '0', mi = '0', sec = '0', frac = '', zone] = m
    const ms = frac ? Number(frac.slice(0, 3).padEnd(3, '0')) : 0
    if (zone) {
      const iso = `${y}-${mo}-${d}T${pad2(Number(h))}:${mi}:${pad2(Number(sec))}.${String(ms).padStart(3, '0')}${zone === 'Z' ? 'Z' : zone.length === 5 ? `${zone.slice(0, 3)}:${zone.slice(3)}` : zone}`
      const date = new Date(iso)
      if (!isNaN(date.getTime())) return date
    } else {
      const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(sec), ms)
      if (!isNaN(date.getTime())) return date
    }
  }
  const direct = new Date(s)
  if (!isNaN(direct.getTime())) return direct
  const dm = s.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dm) {
    const date = new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]))
    if (!isNaN(date.getTime())) return date
  }
  return null
}

/** Clave de día local, igual para ambas gráficas. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Etiqueta corta "dd/MM" a partir de la clave de día. */
export function formatDayLabel(day: string): string {
  const [, mo, d] = day.split('-')
  return `${d}/${mo}`
}

interface ParsedMov {
  mov: MovimientoDTO
  date: Date
  day: string
}

function parseMovimientos(movimientos: MovimientoDTO[]): ParsedMov[] {
  if (!Array.isArray(movimientos)) return []
  const parsed: ParsedMov[] = []
  for (const mov of movimientos) {
    const date = parseFecha(mov?.fecha)
    if (!date) continue
    parsed.push({ mov, date, day: dayKey(date) })
  }
  // Orden cronológico; a igual fecha, por id (orden de inserción en el backend).
  return parsed.sort(
    (a, b) => a.date.getTime() - b.date.getTime() || (a.mov.id ?? 0) - (b.mov.id ?? 0)
  )
}

/** Línea de stock: un punto por día con el último stock registrado ese día. */
export function computeLineData(movimientos: MovimientoDTO[]): LineDataPoint[] {
  const byDay = new Map<string, number>()
  for (const { mov, day } of parseMovimientos(movimientos)) {
    if (typeof mov.stockNuevo !== 'number' || !isFinite(mov.stockNuevo)) continue
    byDay.set(day, mov.stockNuevo) // el último del día gana (lista ordenada)
  }
  return Array.from(byDay.entries()).map(([day, value]) => ({
    day,
    value,
    label: formatDayLabel(day),
  }))
}

export interface DailyTotals {
  day: string
  entradas: number
  salidas: number
}

/** Entradas y salidas sumadas por día local, en orden cronológico. */
export function computeDailyTotals(movimientos: MovimientoDTO[]): DailyTotals[] {
  const byDay = new Map<string, DailyTotals>()
  for (const { mov, day } of parseMovimientos(movimientos)) {
    let acc = byDay.get(day)
    if (!acc) {
      acc = { day, entradas: 0, salidas: 0 }
      byDay.set(day, acc)
    }
    const cantidad = Number(mov.cantidad) || 0
    if (TIPOS_SALIDA.has(mov.tipoMovimiento)) acc.salidas += cantidad
    else acc.entradas += cantidad
  }
  return Array.from(byDay.values())
}

/** Cada cuántos elementos se muestra una etiqueta para que no se encimen. */
export function labelStep(count: number, availableWidth: number, minLabelWidth = X_LABEL_MIN_WIDTH): number {
  if (count <= 0) return 1
  const maxLabels = Math.max(1, Math.floor(availableWidth / minLabelWidth))
  return Math.max(1, Math.ceil(count / maxLabels))
}

/** Ancho útil del área de la gráfica a partir del ancho medido del contenedor. */
export function chartAreaWidth(containerWidth: number): number {
  return Math.max(0, containerWidth - Y_AXIS_LABEL_WIDTH - 8)
}

export interface LineLayout {
  data: LineDataPoint[]
  spacing: number
  hideDataPoints: boolean
}

/** Espaciado y etiquetas (una cada k días) de la línea para que quepa en `chartWidth`. */
export function computeLineLayout(points: LineDataPoint[], chartWidth: number): LineLayout {
  const usable = Math.max(0, chartWidth - 2 * CHART_SIDE_SPACING)
  const spacing = points.length > 1 ? usable / (points.length - 1) : usable
  const step = labelStep(points.length, usable)
  const data = points.map((p, i) => ({ ...p, label: i % step === 0 ? p.label : '' }))
  return { data, spacing, hideDataPoints: points.length > 30 }
}

export interface BarLayout {
  data: BarDataPoint[]
  barWidth: number
  /** Separación entre pares (días). */
  groupSpacing: number
  /** Separación entre la barra de entradas y la de salidas del mismo día. */
  innerSpacing: number
}

const MAX_BAR_WIDTH = 26
const MIN_BAR_WIDTH = 2

/**
 * Barras agrupadas por día (entrada + salida). Siempre se emiten dos barras por
 * día para que los pares queden alineados; la etiqueta "dd/MM" va en la primera
 * barra del par, centrada sobre ambas, y solo cada k días.
 * barWidth = (chartWidth - 16 - n*spacing) / n
 */
export function computeBarLayout(totals: DailyTotals[], chartWidth: number): BarLayout {
  const days = totals.length
  const innerSpacing = 2
  if (days === 0) return { data: [], barWidth: MAX_BAR_WIDTH, groupSpacing: 8, innerSpacing }

  const usable = Math.max(0, chartWidth - 2 * CHART_SIDE_SPACING)
  const groupSpacing = Math.max(4, Math.min(16, (usable / days) * 0.25))
  const n = days * 2
  const totalSpacing = days * (innerSpacing + groupSpacing)
  const rawWidth = (usable - totalSpacing) / n
  const barWidth = Math.max(MIN_BAR_WIDTH, Math.min(MAX_BAR_WIDTH, rawWidth))
  const pairWidth = barWidth * 2 + innerSpacing
  const step = labelStep(days, usable)

  const data: BarDataPoint[] = []
  const labelWidth = Math.max(pairWidth, X_LABEL_MIN_WIDTH)
  // La etiqueta del último día se saldría por la derecha si es más ancha que su par.
  const lastOverflows = labelWidth > pairWidth + groupSpacing
  totals.forEach((t, i) => {
    const showLabel = i % step === 0 && !(i === days - 1 && i > 0 && lastOverflows)
    data.push({
      value: t.entradas,
      frontColor: COLOR_ENTRADA,
      spacing: innerSpacing,
      label: showLabel ? formatDayLabel(t.day) : '',
      labelWidth,
      labelTextStyle: { textAlign: 'center' },
    })
    data.push({ value: t.salidas, frontColor: COLOR_SALIDA, spacing: groupSpacing })
  })
  return { data, barWidth, groupSpacing, innerSpacing }
}

export interface YAxisConfig {
  maxValue: number
  stepValue: number
  noOfSections: number
}

/**
 * Eje Y con margen de 10% y al menos 1 (evita división entre 0 cuando todo es 0),
 * redondeado para que cada sección sea un entero.
 */
export function computeYAxis(values: number[], noOfSections = 4): YAxisConfig {
  const finite = values.filter(v => typeof v === 'number' && isFinite(v))
  const max = finite.length > 0 ? Math.max(...finite) : 0
  const target = Math.max(1, max) * 1.1
  const stepValue = Math.max(1, Math.ceil(target / noOfSections))
  return { maxValue: stepValue * noOfSections, stepValue, noOfSections }
}

/** Formatea etiquetas del eje Y: 1500 → "1.5k", 2000 → "2k". */
export function formatYLabel(label: string): string {
  const n = Number(label)
  if (!isFinite(n)) return label
  const abs = Math.abs(n)
  if (abs >= 1000) {
    const k = n / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1).replace(/\.0$/, '')}k`
  }
  return String(Math.round(n))
}

export function computeTrend(movimientos: MovimientoDTO[]): number | null {
  const now = new Date()
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - now.getDay())
  startOfThisWeek.setHours(0, 0, 0, 0)
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

  const fechas = parseMovimientos(movimientos).map(p => p.date)
  const thisWeek = fechas.filter(d => d >= startOfThisWeek).length
  const lastWeek = fechas.filter(d => d >= startOfLastWeek && d < startOfThisWeek).length

  if (lastWeek === 0) return null
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
}
