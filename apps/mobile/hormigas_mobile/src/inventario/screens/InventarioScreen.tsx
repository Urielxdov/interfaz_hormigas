import { useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Package, Plus } from 'lucide-react-native'
import { InventarioItemDTO } from '@hormigas/application'
import { useInventarioSucursal } from '@/src/utils/hooks/useInventarioSucursal'
import Modal from '@/src/utils/components/Modal'
import CreateInventarioScreen from './CreateInventarioScreen'

interface Props {
  sucursalId: number
  sucursalNombre: string
}

function StockBadge({ item }: { item: InventarioItemDTO }) {
  if (item.stockActual === 0)
    return <Text className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-semibold">Crítico</Text>
  if (item.stockActual < item.stockMinimo)
    return <Text className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-semibold">Bajo</Text>
  return <Text className="text-xs bg-green-100 text-green-600 rounded-full px-2 py-0.5 font-semibold">OK</Text>
}

export default function InventarioScreen({ sucursalId, sucursalNombre }: Props) {
  const { items, loading, crearInventario, refresh } = useInventarioSucursal(sucursalId)
  const [showCreate, setShowCreate] = useState(false)

  const goToMovimiento = (item: InventarioItemDTO, tipo?: 'ENTRADA' | 'SALIDA') => {
    const params: Record<string, string> = {
      productoId: String(item.productoId),
      productoNombre: item.productoNombre,
    }
    if (tipo) params.tipoPreseleccionado = tipo
    router.push({
      pathname: '/(branche)/[sucursalId]/movimiento',
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
    <View className="flex-1 bg-stone-50 dark:bg-zinc-950">
      <View className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="font-sans-bold text-xl text-zinc-900 dark:text-zinc-50">Inventario</Text>
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">{sucursalNombre}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          className="bg-indigo-600 rounded-lg px-3 py-2 flex-row items-center gap-1"
        >
          <Plus size={16} color="white" />
          <Text className="text-white text-sm font-sans-medium">Agregar</Text>
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
            <Package size={48} color="#a8a29e" />
            <Text className="text-stone-400">Sin productos en esta sucursal</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white dark:bg-zinc-900 rounded-xl border border-stone-200 dark:border-zinc-800 p-4 gap-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="font-sans-semibold text-zinc-900 dark:text-zinc-50">{item.productoNombre}</Text>
                {item.precio != null && (
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">${item.precio.toFixed(2)}</Text>
                )}
              </View>
              <StockBadge item={item} />
            </View>

            <View className="flex-row gap-2 justify-around">
              <View className="items-center">
                <Text className="text-xs text-zinc-400">Actual</Text>
                <Text className="font-sans-bold text-lg text-zinc-900 dark:text-zinc-50">{item.stockActual}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-zinc-400">Mín</Text>
                <Text className="text-lg text-zinc-700 dark:text-zinc-300">{item.stockMinimo}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-zinc-400">Máx</Text>
                <Text className="text-lg text-zinc-700 dark:text-zinc-300">{item.stockMaximo}</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => goToMovimiento(item, 'SALIDA')}
                className="flex-1 bg-red-500 rounded-lg py-2 items-center"
              >
                <Text className="text-white font-sans-semibold">Venta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => goToMovimiento(item, 'ENTRADA')}
                className="flex-1 bg-green-600 rounded-lg py-2 items-center"
              >
                <Text className="text-white font-sans-semibold">Compra</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => goToMovimiento(item)}
                className="flex-1 bg-stone-100 dark:bg-zinc-800 rounded-lg py-2 items-center"
              >
                <Text className="text-zinc-700 dark:text-zinc-300 font-sans-semibold">Otro</Text>
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
