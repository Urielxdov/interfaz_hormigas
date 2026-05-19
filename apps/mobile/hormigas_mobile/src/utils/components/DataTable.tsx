import { LucideIcon } from 'lucide-react-native'
import React, { useState, useCallback } from 'react'
import useIsTablet from '../hooks/useIsTablet'
import { ScrollView, View, LayoutChangeEvent } from 'react-native'
import { Text } from 'react-native'

export interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  title: string
  description?: string
  icon: LucideIcon
}

export default function DataTable<T>({
  columns,
  data,
  title,
  description,
  icon: Icon
}: DataTableProps<T>) {
  const isTablet = useIsTablet()
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
    setMeasuredCount(prev => {
      if (prev >= totalCells) return prev
      return prev + 1
    })
  }, [totalCells])

  const getCellStyle = (key: string) => {
    if (!measured) return {}
    const width = colWidths[key]
    return width ? { width } : { flex: 1 }
  }

  return (
    <View className='border rounded-2xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden'>
      <View className='p-4'>
        <View className='flex flex-row items-center gap-2'>
          <Icon size={24} color='#6366f1' />
          <Text className='font-sans-bold text-zinc-900 dark:text-zinc-50'>{title}</Text>
        </View>
        {description && (
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm mt-1'>{description}</Text>
        )}
      </View>

      <ScrollView horizontal={!isTablet} scrollEnabled={!isTablet}>
        <View>
          <View className='flex-row border-t border-stone-100 dark:border-zinc-800 px-3 py-2 bg-stone-50 dark:bg-zinc-800/60'>
            {columns.map(col => {
              const key = String(col.key)
              return (
                <View
                  key={key}
                  style={getCellStyle(key)}
                  onLayout={e => handleLayout(key, e)}
                  className='pr-4'
                >
                  <Text className='font-sans-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase text-center tracking-wide'>
                    {col.label}
                  </Text>
                </View>
              )
            })}
          </View>

          {data.map((row, i) => (
            <View
              key={i}
              className={`flex-row border-t border-stone-100 dark:border-zinc-800 px-3 py-3 ${
                i % 2 === 0 ? '' : 'bg-stone-50 dark:bg-zinc-800/40'
              }`}
            >
              {columns.map(col => {
                const key = String(col.key)
                return (
                  <View
                    key={key}
                    style={getCellStyle(key)}
                    onLayout={e => handleLayout(key, e)}
                    className='pr-4'
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : <Text className='font-sans text-center text-zinc-800 dark:text-zinc-200 text-sm'>{String(row[col.key] ?? '')}</Text>
                    }
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
