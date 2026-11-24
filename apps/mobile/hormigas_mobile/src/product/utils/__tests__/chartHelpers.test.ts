import { describe, it, expect } from '@jest/globals'
import type { MovimientoDTO } from '@hormigas/application'
import {
  parseFecha,
  dayKey,
  computeLineData,
  computeDailyTotals,
  computeBarLayout,
  computeLineLayout,
  computeYAxis,
  formatYLabel,
  chartAreaWidth,
  Y_AXIS_LABEL_WIDTH,
  COLOR_ENTRADA,
  COLOR_SALIDA,
} from '../chartHelpers'

let nextId = 1
const mov = (over: Partial<MovimientoDTO>): MovimientoDTO => ({
  id: nextId++,
  productoId: 1,
  productoNombre: 'P',
  sucursalId: 1,
  sucursalNombre: 'S',
  tipoMovimiento: 'ENTRADA',
  cantidad: 1,
  usuarioNombre: 'u',
  fecha: '2026-11-20T10:00:00',
  ...over,
})

describe('parseFecha', () => {
  it('acepta LocalDateTime con microsegundos como hora local', () => {
    const d = parseFecha('2026-11-20T14:23:11.123456')!
    expect(d).not.toBeNull()
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10)
    expect(d.getDate()).toBe(20)
    expect(d.getHours()).toBe(14)
    expect(d.getMinutes()).toBe(23)
    expect(d.getMilliseconds()).toBe(123)
  })

  it('acepta fecha sola y fechas con zona', () => {
    expect(dayKey(parseFecha('2026-01-05')!)).toBe('2026-01-05')
    const z = parseFecha('2026-01-05T12:00:00.123456Z')!
    expect(z.getTime()).toBe(Date.UTC(2026, 0, 5, 12, 0, 0, 123))
  })

  it('devuelve null para valores inválidos', () => {
    expect(parseFecha('')).toBeNull()
    expect(parseFecha(undefined)).toBeNull()
    expect(parseFecha('no es fecha')).toBeNull()
  })
})

describe('computeLineData', () => {
  it('vacío → []', () => {
    expect(computeLineData([])).toEqual([])
    expect(computeLineData(null as unknown as MovimientoDTO[])).toEqual([])
  })

  it('un solo punto', () => {
    const data = computeLineData([mov({ stockNuevo: 7, fecha: '2026-11-20T10:00:00.5' })])
    expect(data).toEqual([{ day: '2026-11-20', value: 7, label: '20/11' }])
  })

  it('agrupa por día con el último stock del día, en orden cronológico', () => {
    const data = computeLineData([
      mov({ stockNuevo: 5, fecha: '2026-11-21T09:00:00.000001' }),
      mov({ stockNuevo: 10, fecha: '2026-11-20T08:00:00.123456' }),
      mov({ stockNuevo: 3, fecha: '2026-11-21T18:30:00.999999' }),
      mov({ stockNuevo: 8, fecha: '2026-11-20T20:00:00' }),
      mov({ fecha: '2026-11-22T10:00:00' }), // sin stockNuevo: se ignora
      mov({ stockNuevo: 1, fecha: 'basura' }), // fecha inválida: se ignora
    ])
    expect(data.map(d => [d.day, d.value])).toEqual([
      ['2026-11-20', 8],
      ['2026-11-21', 3],
    ])
  })
})

describe('computeDailyTotals / computeBarLayout', () => {
  it('suma entradas y salidas por día con la misma clave de día que la línea', () => {
    const totals = computeDailyTotals([
      mov({ tipoMovimiento: 'ENTRADA', cantidad: 4, fecha: '2026-11-20T08:00:00.123456' }),
      mov({ tipoMovimiento: 'VENTA', cantidad: 2, fecha: '2026-11-20T23:59:59.999999' }),
      mov({ tipoMovimiento: 'SALIDA', cantidad: 1, fecha: '2026-11-21T00:00:00' }),
    ])
    expect(totals).toEqual([
      { day: '2026-11-20', entradas: 4, salidas: 2 },
      { day: '2026-11-21', entradas: 0, salidas: 1 },
    ])
  })

  it('emite dos barras por día y cabe en el ancho disponible', () => {
    const totals = Array.from({ length: 10 }, (_, i) => ({
      day: `2026-11-${String(i + 1).padStart(2, '0')}`,
      entradas: i,
      salidas: 1,
    }))
    const chartWidth = 280
    const { data, barWidth, groupSpacing, innerSpacing } = computeBarLayout(totals, chartWidth)
    expect(data).toHaveLength(20)
    expect(data[0].frontColor).toBe(COLOR_ENTRADA)
    expect(data[1].frontColor).toBe(COLOR_SALIDA)
    expect(data[0].label).toBe('01/11')
    const used = 16 + totals.length * (2 * barWidth + innerSpacing + groupSpacing)
    expect(used).toBeLessThanOrEqual(chartWidth + 0.001)
    // Etiquetas espaciadas: no todas las barras de entrada llevan etiqueta.
    const labels = data.filter(d => d.label).length
    expect(labels).toBeGreaterThan(0)
    expect(labels).toBeLessThanOrEqual(Math.floor((chartWidth - 16) / 40))
  })

  it('vacío → sin barras', () => {
    expect(computeBarLayout([], 300).data).toEqual([])
  })
})

describe('computeLineLayout', () => {
  it('reparte el espacio entre los puntos y adelgaza etiquetas', () => {
    const points = Array.from({ length: 31 }, (_, i) => ({
      day: `2026-10-${String(i + 1).padStart(2, '0')}`,
      value: i,
      label: 'x',
    }))
    const { data, spacing, hideDataPoints } = computeLineLayout(points, 300)
    expect(spacing * 30).toBeCloseTo(300 - 16)
    expect(hideDataPoints).toBe(true)
    expect(data.filter(d => d.label).length).toBeLessThan(31)
  })

  it('un punto no produce NaN', () => {
    const { spacing } = computeLineLayout([{ day: '2026-10-01', value: 1, label: '01/10' }], 200)
    expect(Number.isFinite(spacing)).toBe(true)
  })
})

describe('eje Y', () => {
  it('todos 0 → maxValue > 0', () => {
    const y = computeYAxis([0, 0, 0])
    expect(y.maxValue).toBeGreaterThan(0)
    expect(y.maxValue).toBe(y.stepValue * y.noOfSections)
  })

  it('vacío → maxValue > 0', () => {
    expect(computeYAxis([]).maxValue).toBeGreaterThan(0)
  })

  it('deja ~10% de margen sobre el máximo', () => {
    const y = computeYAxis([100])
    expect(y.maxValue).toBeGreaterThanOrEqual(110)
  })

  it('formatYLabel abrevia miles', () => {
    expect(formatYLabel('0')).toBe('0')
    expect(formatYLabel('250')).toBe('250')
    expect(formatYLabel('1500')).toBe('1.5k')
    expect(formatYLabel('2000')).toBe('2k')
  })

  it('chartAreaWidth descuenta el eje Y', () => {
    expect(chartAreaWidth(300)).toBe(300 - Y_AXIS_LABEL_WIDTH - 8)
    expect(chartAreaWidth(0)).toBe(0)
  })
})
