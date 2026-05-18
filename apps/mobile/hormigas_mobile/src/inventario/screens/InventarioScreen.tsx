import { useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Package, Plus } from 'lucide-react-native'
import { InventarioItemDTO } from '@hormigas/application'
import { useInventario } from '@/src/utils/hooks/useInventario'
import Modal from '@/src/utils/components/Modal'
import CreateInventarioScreen from './CreateInventarioScreen'

interface Props {
  sucursalId: number
  sucursalNombre: string
}

function StockBadge({ item }: { item: InventarioItemDTO }) {
  if (item.stockActual === 0) {
    return <Text className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-semibold">Crítico</Text>
  }
  if (item.stockActual < item.stockMinimo) {
    return <Text className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-semibold">Bajo</Text>
  }
  return <Text className="text-xs bg-green-100 text-green-600 rounded-full px-2 py-0.5 font-semibold">OK</Text>
}

export default function InventarioScreen({ sucursalId, sucursalNombre }: Props) {
  const { items, loading, crearInventario, refresh } = useInventario(sucursalId)
  const [showCreate, setShowCreate] = useState(false)

  const goToMovimiento = (item: InventarioItemDTO, tipo?: 'VENTA' | 'COMPRA') => {
    const params: Record<string, string> = {
      inventarioId: String(item.id),
      productoId: String(item.productoId),
      productoNombre: item.productoNombre,
    }
    if (tipo) params.tipoPreseleccionado = tipo
    router.push({
      pathname: `/(branche)/[sucursalId]/movimiento`,
      params: { sucursalId: String(sucursalId), ...params },
    })
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 px-5 pt-14 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-gray-900">Inventario</Text>
          <Text className="text-sm text-gray-500">{sucursalNombre}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          className="bg-black rounded-lg p-2 flex-row items-center gap-1"
        >
          <Plus size={18} color="white" />
          <Text className="text-white text-sm font-medium">Agregar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={
          <View className="items-center py-16 gap-2">
            <Package size={48} color="#9ca3af" />
            <Text className="text-gray-400">Sin productos en esta sucursal</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl border border-gray-200 p-4 gap-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{item.productoNombre}</Text>
                {item.precio != null && (
                  <Text className="text-sm text-gray-500">${item.precio.toFixed(2)}</Text>
                )}
              </View>
              <StockBadge item={item} />
            </View>

            <View className="flex-row gap-2 justify-between">
              <View className="items-center">
                <Text className="text-xs text-gray-400">Actual</Text>
                <Text className="font-bold text-lg">{item.stockActual}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-gray-400">Mín</Text>
                <Text className="text-lg">{item.stockMinimo}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-gray-400">Máx</Text>
                <Text className="text-lg">{item.stockMaximo}</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => goToMovimiento(item, 'VENTA')}
                className="flex-1 bg-red-500 rounded-lg py-2 items-center"
              >
                <Text className="text-white font-semibold">Venta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => goToMovimiento(item, 'COMPRA')}
                className="flex-1 bg-green-500 rounded-lg py-2 items-center"
              >
                <Text className="text-white font-semibold">Compra</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => goToMovimiento(item)}
                className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
              >
                <Text className="text-gray-700 font-semibold">Otro</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <CreateInventarioScreen
          sucursalId={sucursalId}
          onSuccess={async (dto) => {
            await crearInventario(dto)
            setShowCreate(false)
          }}
        />
      </Modal>
    </View>
  )
}
