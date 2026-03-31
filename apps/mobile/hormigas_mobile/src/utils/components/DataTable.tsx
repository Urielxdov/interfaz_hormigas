import { LucideIcon } from "lucide-react-native"
import React, { useState, useCallback } from "react"
import useIsTablet from "../hooks/useIsTablet"
import { ScrollView, View, LayoutChangeEvent } from "react-native"
import { Text } from "react-native"

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

    // Cuántas celdas esperamos medir en total
    const totalCells = (data.length + 1) * columns.length  // +1 por la fila de encabezados

    const [colWidths, setColWidths] = useState<Record<string, number>>({})
    const [measuredCount, setMeasuredCount] = useState(0)
    const measured = measuredCount >= totalCells  // true = segunda pasada

    const handleLayout = useCallback((colKey: string, e: LayoutChangeEvent) => {
        const width = e.nativeEvent.layout.width
        setColWidths(prev => {
            const current = prev[colKey] ?? 0
            if (width <= current) return prev
            return { ...prev, [colKey]: width }
        })
        // Solo contamos en la primera pasada
        setMeasuredCount(prev => {
            if (prev >= totalCells) return prev
            return prev + 1
        })
    }, [totalCells])

    const getCellStyle = (key: string) => {
        if (!measured) return {}           // primera pasada: sin restricción de ancho
        const width = colWidths[key]
        return width ? { width } : { flex: 1 }  // segunda pasada: ancho fijo
    }

    return (
        <View className="border rounded-xl border-gray-200">
            {/* Header */}
            <View className="p-3">
                <View className="flex flex-row items-center gap-2">
                    <Icon size={28} color='green' />
                    <Text className="font-bold">{title}</Text>
                </View>
                {description && <Text className="text-gray-600">{description}</Text>}
            </View>

            <ScrollView horizontal={!isTablet} scrollEnabled={!isTablet}>
                <View>
                    {/* Encabezados */}
                    <View className="flex-row border-t border-gray-200 px-2 py-2">
                        {columns.map(col => {
                            const key = String(col.key)
                            return (
                                <View
                                    key={key}
                                    style={getCellStyle(key)}
                                    onLayout={e => handleLayout(key, e)}
                                    className="pr-4"
                                >
                                    <Text className="text-xs text-gray-400 uppercase font-bold text-center">
                                        {col.label}
                                    </Text>
                                </View>
                            )
                        })}
                    </View>

                    {/* Filas */}
                    {data.map((row, i) => (
                        <View key={i} className="flex-row border-t border-gray-200 px-2 py-3">
                            {columns.map(col => {
                                const key = String(col.key)
                                return (
                                    <View
                                        key={key}
                                        style={getCellStyle(key)}
                                        onLayout={e => handleLayout(key, e)}
                                        className="pr-4"
                                    >
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : <Text className="text-center">{String(row[col.key])}</Text>
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
