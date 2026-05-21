import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator
} from 'react-native'
import { CreateInventarioDTO } from '@hormigas/application'
import { getProductService } from '@/src/adapters/productServiceInstance'

interface Props {
  onSuccess: (dto: CreateInventarioDTO) => Promise<void>
}

interface ProductoOption {
  id: number
  nombre: string
}

export default function CreateInventarioScreen({ onSuccess }: Props) {
  const [productos, setProductos] = useState<ProductoOption[]>([])
  const [productoId, setProductoId] = useState<number | null>(null)
  const [stockActual, setStockActual] = useState('')
  const [stockMinimo, setStockMinimo] = useState('')
  const [stockMaximo, setStockMaximo] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getProductService()
      .then(svc => svc.findAll())
      .then(ps => {
        if (cancelled) return
        setProductos(
          ps
            .filter(p => p.categoriaId != null)
            .map(p => ({ id: p.categoriaId!, nombre: p.nombre }))
        )
      })
      .catch(() => setError('No se pudieron cargar productos'))
      .finally(() => { if (!cancelled) setLoadingProductos(false) })
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async () => {
    if (!productoId || !stockActual || !stockMinimo || !stockMaximo) {
      setError('Todos los campos son obligatorios')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSuccess({
        productoId,
        stockActual: Number(stockActual),
        stockMinimo: Number(stockMinimo),
        stockMaximo: Number(stockMaximo),
      })
    } catch {
      setError('Error al crear inventario')
    } finally {
      setLoading(false)
    }
  }

  if (loadingProductos) {
    return <ActivityIndicator size="large" style={{ margin: 32 }} />
  }

  return (
    <ScrollView className="p-4" contentContainerStyle={{ gap: 16 }}>
      <Text className="font-sans-bold text-xl text-zinc-900 dark:text-zinc-50">
        Agregar producto al inventario
      </Text>

      <View className="gap-2">
        <Text className="text-sm font-sans-medium text-zinc-700 dark:text-zinc-300">Producto</Text>
        <View className="border border-stone-200 dark:border-zinc-700 rounded-xl overflow-hidden">
          {productos.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setProductoId(p.id)}
              className={`px-4 py-3 border-b border-stone-100 dark:border-zinc-800 ${productoId === p.id ? 'bg-indigo-50 dark:bg-indigo-950' : ''}`}
            >
              <Text className={`${productoId === p.id ? 'text-indigo-600 font-sans-semibold' : 'text-zinc-900 dark:text-zinc-50'}`}>
                {p.nombre}
              </Text>
            </TouchableOpacity>
          ))}
          {productos.length === 0 && (
            <Text className="px-4 py-3 text-zinc-400">Sin productos sincronizados</Text>
          )}
        </View>
      </View>

      {(
        [
          { label: 'Stock inicial', value: stockActual, set: setStockActual },
          { label: 'Stock mínimo', value: stockMinimo, set: setStockMinimo },
          { label: 'Stock máximo', value: stockMaximo, set: setStockMaximo },
        ] as { label: string; value: string; set: (v: string) => void }[]
      ).map(({ label, value, set }) => (
        <View key={label} className="gap-1">
          <Text className="text-sm font-sans-medium text-zinc-700 dark:text-zinc-300">{label}</Text>
          <TextInput
            value={value}
            onChangeText={set}
            keyboardType="numeric"
            className="border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-base text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-900"
            placeholder="0"
            placeholderTextColor="#a1a1aa"
          />
        </View>
      ))}

      {error != null && <Text className="text-red-500 text-sm">{error}</Text>}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className="bg-indigo-600 rounded-xl py-3 items-center"
      >
        {loading
          ? <ActivityIndicator color="white" />
          : <Text className="text-white font-sans-semibold">Guardar</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}
