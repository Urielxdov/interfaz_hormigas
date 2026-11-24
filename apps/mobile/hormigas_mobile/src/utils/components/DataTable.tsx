import { Inbox, LucideIcon } from 'lucide-react-native'
import React, { useState, useCallback } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { Pressable, ScrollView, View, LayoutChangeEvent, Text } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

export interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  /** Celular: titulo de la tarjeta. Por defecto la primera columna. */
  primary?: boolean
  /** Celular: subtitulo bajo el titulo (ej. SKU, correo). */
  secondary?: boolean
  /** Celular: se muestra junto al titulo (ej. estado). */
  badge?: boolean
  /** Celular: va al pie de la tarjeta (botones). */
  actions?: boolean
  /** Celular: no mostrar esta columna. */
  hideOnPhone?: boolean
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  title: string
  description?: string
  icon: LucideIcon
  /** Texto cuando no hay filas. */
  emptyMessage?: string
  keyExtractor?: (row: T, index: number) => string
  onRowPress?: (row: T) => void
  /** Elemento a la derecha del titulo (ej. contador o boton). */
  headerRight?: React.ReactNode
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' } as const

function CellText ({ value, align = 'left', strong = false }: { value: unknown; align?: 'left' | 'center' | 'right'; strong?: boolean }) {
  const text = value === null || value === undefined || value === '' ? '—' : String(value)
  return (
    <Text
      className={`${strong ? 'font-sans-semibold text-zinc-900 dark:text-zinc-50' : 'font-sans text-zinc-700 dark:text-zinc-300'} text-sm ${alignClass[align]}`}
      numberOfLines={2}
    >
      {text}
    </Text>
  )
}

function renderCell<T> (col: Column<T>, row: T, strong = false) {
  return col.render
    ? col.render(row[col.key], row)
    : <CellText value={row[col.key]} align={col.align} strong={strong} />
}

export default function DataTable<T>({
  columns,
  data,
  title,
  description,
  icon: Icon,
  emptyMessage = 'No hay registros para mostrar',
  keyExtractor,
  onRowPress,
  headerRight,
}: DataTableProps<T>) {
  const bp = useBreakpoint()
  const isPhone = bp === 'phone'

  const header = (
    <View className='p-4 flex-row items-start justify-between gap-3'>
      <View className='flex-1'>
        <View className='flex flex-row items-center gap-2'>
          <View className='w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center'>
            <Icon size={18} color='#6366f1' />
          </View>
          <Text className='font-sans-bold text-base text-zinc-900 dark:text-zinc-50'>{title}</Text>
          <View className='px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800'>
            <Text className='font-sans-medium text-xs text-zinc-500 dark:text-zinc-400'>{data.length}</Text>
          </View>
        </View>
        {description && (
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm mt-1'>{description}</Text>
        )}
      </View>
      {headerRight}
    </View>
  )

  const empty = (
    <View className='items-center py-8 gap-2 border-t border-stone-100 dark:border-zinc-800'>
      <Inbox size={28} color='#a1a1aa' />
      <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-sm text-center px-6'>{emptyMessage}</Text>
    </View>
  )

  return (
    <View className='border rounded-2xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden'>
      {header}
      {data.length === 0
        ? empty
        : isPhone
          ? <CardList columns={columns} data={data} keyExtractor={keyExtractor} onRowPress={onRowPress} />
          : <Table columns={columns} data={data} keyExtractor={keyExtractor} onRowPress={onRowPress} large={bp === 'large'} />}
    </View>
  )
}

interface BodyProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor?: (row: T, index: number) => string
  onRowPress?: (row: T) => void
}

/** Celular: una tarjeta por fila (titulo, subtitulo, estado, datos en dos columnas y acciones). */
function CardList<T> ({ columns, data, keyExtractor, onRowPress }: BodyProps<T>) {
  const visible = columns.filter(c => !c.hideOnPhone)
  const primary = visible.find(c => c.primary) ?? visible.find(c => !c.actions && !c.badge && !c.secondary)
  const secondary = visible.filter(c => c.secondary)
  const badges = visible.filter(c => c.badge)
  const actions = visible.filter(c => c.actions)
  const fields = visible.filter(c => c !== primary && !c.secondary && !c.badge && !c.actions)

  return (
    <View className='px-3 pb-3 gap-2'>
      {data.map((row, i) => (
        <Animated.View key={keyExtractor?.(row, i) ?? i} entering={FadeInDown.delay(Math.min(i * 40, 240)).duration(240)}>
          <Pressable
            onPress={onRowPress ? () => onRowPress(row) : undefined}
            disabled={!onRowPress}
            className='rounded-xl border border-stone-100 dark:border-zinc-800 bg-stone-50/60 dark:bg-zinc-800/40 p-3 gap-2 active:opacity-80'
          >
            <View className='flex-row items-start justify-between gap-2'>
              <View className='flex-1 gap-0.5'>
                {primary && renderCell(primary, row, true)}
                {secondary.map(col => (
                  <View key={String(col.key)}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : <Text className='font-sans text-xs text-zinc-500 dark:text-zinc-400' numberOfLines={1}>{String(row[col.key] ?? '')}</Text>}
                  </View>
                ))}
              </View>
              {badges.map(col => <View key={String(col.key)}>{renderCell(col, row)}</View>)}
            </View>

            {fields.length > 0 && (
              <View className='flex-row flex-wrap'>
                {fields.map(col => (
                  <View key={String(col.key)} className='w-1/2 pr-2 py-1'>
                    <Text className='font-sans-medium text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500'>{col.label}</Text>
                    {renderCell({ ...col, align: 'left' }, row)}
                  </View>
                ))}
              </View>
            )}

            {actions.length > 0 && (
              <View className='flex-row justify-end gap-2 pt-2 border-t border-stone-100 dark:border-zinc-800'>
                {actions.map(col => <View key={String(col.key)}>{renderCell(col, row)}</View>)}
              </View>
            )}
          </Pressable>
        </Animated.View>
      ))}
    </View>
  )
}

/** Tablet: tabla con columnas medidas al contenido. */
function Table<T> ({ columns, data, keyExtractor, onRowPress, large }: BodyProps<T> & { large: boolean }) {
  const cellPadding = large ? 'px-3' : 'px-2'
  const totalCells = (data.length + 1) * columns.length

  const [colWidths, setColWidths] = useState<Record<string, number>>({})
  const [measuredCount, setMeasuredCount] = useState(0)
  const measured = measuredCount >= totalCells

  const handleLayout = useCallback((colKey: string, e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width
    setColWidths(prev => {
      const current = prev[colKey] ?? 0
      if (width <= current) return prev
      return { ...prev, [colKey]: width }
    })
    setMeasuredCount(prev => (prev >= totalCells ? prev : prev + 1))
  }, [totalCells])

  const getCellStyle = (key: string) => {
    if (!measured) return {}
    const width = colWidths[key]
    return width ? { minWidth: width, flex: 1 } : { flex: 1 }
  }

  return (
    <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1 }}>
        <View className='flex-row border-t border-stone-100 dark:border-zinc-800 px-2 py-2 bg-stone-50 dark:bg-zinc-800/60'>
          {columns.map(col => {
            const key = String(col.key)
            return (
              <View key={key} style={getCellStyle(key)} onLayout={e => handleLayout(key, e)} className={cellPadding}>
                <Text className={`font-sans-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide ${alignClass[col.align ?? (col.actions ? 'right' : 'left')]}`}>
                  {col.label}
                </Text>
              </View>
            )
          })}
        </View>

        {data.map((row, i) => (
          <Animated.View key={keyExtractor?.(row, i) ?? i} entering={FadeInDown.delay(Math.min(i * 40, 240)).duration(240)}>
            <Pressable
              onPress={onRowPress ? () => onRowPress(row) : undefined}
              disabled={!onRowPress}
              className={`flex-row items-center border-t border-stone-100 dark:border-zinc-800 px-2 py-3 ${i % 2 === 0 ? '' : 'bg-stone-50 dark:bg-zinc-800/40'}`}
            >
              {columns.map(col => {
                const key = String(col.key)
                return (
                  <View
                    key={key}
                    style={getCellStyle(key)}
                    onLayout={e => handleLayout(key, e)}
                    className={`${cellPadding} ${col.actions ? 'items-end' : ''}`}
                  >
                    {renderCell(col, row, col.primary)}
                  </View>
                )
              })}
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  )
}
