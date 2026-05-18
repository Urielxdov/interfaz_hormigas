import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { CreateInventarioDTO } from '@hormigas/application'
import { getProductService } from '@/src/adapters/productServiceInstance'

interface Props {
  sucursalId: number
  onSuccess: (dto: CreateInventarioDTO) => Promise<void>
}

interface ProductoOption {
  id: number
  nombre: string
}

export default function CreateInventarioScreen({ sucursalId, onSuccess }: Props) {
  const [productos, setProductos] = useState<ProductoOption[]>([])
  const [productoId, setProductoId] = useState<number | null>(null)
  const [stockActual, setStockActual] = useState('')
  const [stockMinimo, setStockMinimo] = useState('')
  const [stockMaximo, setStockMaximo] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProductService()
      .then(svc => svc.findAll())
      .then(ps =>
        setProductos(
          ps
            .filter(p => p.categoriaId != null)
            .map(p => ({ id: p.categoriaId!, nombre: p.nombre }))
        )
      )
      .catch(() => setError('No se pudieron cargar productos'))
      .finally(() => setLoadingProductos(false))
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
        sucursalId,
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
      <Text className="text-xl font-bold">Agregar producto al inventario</Text>

      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">Producto</Text>
        <View className="border border-gray-200 rounded-lg overflow-hidden">
          {productos.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setProductoId(p.id)}
              className={`px-4 py-3 border-b border-gray-100 ${productoId === p.id ? 'bg-blue-50' : ''}`}
            >
              <Text className={productoId === p.id ? 'text-blue-600 font-semibold' : 'text-gray-900'}>
                {p.nombre}
              </Text>
            </TouchableOpacity>
          ))}
          {productos.length === 0 && (
            <View className="px-4 py-3">
              <Text className="text-gray-400">Sin productos disponibles</Text>
            </View>
          )}
        </View>
      </View>

      {[
        { label: 'Stock inicial', value: stockActual, set: setStockActual },
        { label: 'Stock mínimo', value: stockMinimo, set: setStockMinimo },
        { label: 'Stock máximo', value: stockMaximo, set: setStockMaximo },
      ].map(({ label, value, set }) => (
        <View key={label} className="gap-1">
          <Text className="text-sm font-medium text-gray-700">{label}</Text>
          <TextInput
            value={value}
            onChangeText={set}
            keyboardType="numeric"
            className="border border-gray-200 rounded-lg px-3 py-2 text-base"
            placeholder="0"
          />
        </View>
      ))}

      {error && <Text className="text-red-500 text-sm">{error}</Text>}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className="bg-black rounded-lg py-3 items-center"
      >
        {loading
          ? <ActivityIndicator color="white" />
          : <Text className="text-white font-semibold">Guardar</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}
