import { useAuth } from '@/context/AuthContext'
import { usePOS } from '@/hooks/usePOS'
import { POSProductDTO, CartItem } from '@hormigas/application'
import { useRouter } from 'expo-router'
import { LogOut, Minus, Plus, ShoppingCart, Wifi, WifiOff } from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, Modal,
  ScrollView, Text, TextInput, TouchableOpacity, View
} from 'react-native'
import { useNetwork } from '@/context/NetworkContext'

function ProductCard({ product, onAdd }: { product: POSProductDTO; onAdd: () => void }) {
  return (
    <TouchableOpacity
      className='bg-white rounded-xl p-3 border border-gray-100 gap-2'
      onPress={onAdd}
    >
      <Text className='font-semibold text-gray-900 text-sm' numberOfLines={2}>{product.nombre}</Text>
      {product.sku && <Text className='text-xs text-gray-400'>{product.sku}</Text>}
      <View className='flex-row items-center justify-between mt-1'>
        <Text className='text-blue-600 font-bold'>
          ${(product.precio ?? 0).toFixed(2)}
        </Text>
        <Text className='text-xs text-gray-400'>Stock: {product.stockActual}</Text>
      </View>
      <View className='bg-black rounded-lg py-1.5 items-center'>
        <Plus size={16} color='white' />
      </View>
    </TouchableOpacity>
  )
}

function CartItemRow({ item, onAdd, onRemove }: { item: CartItem; onAdd: () => void; onRemove: () => void }) {
  return (
    <View className='flex-row items-center gap-3 py-2 border-b border-gray-100'>
      <View className='flex-1'>
        <Text className='text-sm font-medium text-gray-900' numberOfLines={1}>{item.nombre}</Text>
        <Text className='text-xs text-gray-500'>${item.precio.toFixed(2)} c/u</Text>
      </View>
      <View className='flex-row items-center gap-2'>
        <TouchableOpacity onPress={onRemove} className='w-7 h-7 bg-gray-100 rounded-full items-center justify-center'>
          <Minus size={14} color='#374151' />
        </TouchableOpacity>
        <Text className='w-6 text-center font-semibold'>{item.cantidad}</Text>
        <TouchableOpacity onPress={onAdd} className='w-7 h-7 bg-gray-100 rounded-full items-center justify-center'>
          <Plus size={14} color='#374151' />
        </TouchableOpacity>
      </View>
      <Text className='w-16 text-right font-semibold text-sm'>
        ${(item.precio * item.cantidad).toFixed(2)}
      </Text>
    </View>
  )
}

export default function SaleScreen() {
  const { branchId, branchName, logout } = useAuth()
  const { isOnline } = useNetwork()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [cartVisible, setCartVisible] = useState(false)

  const { products, cart, total, isLoading, isSyncing, addToCart, removeFromCart, submitSale } =
    usePOS(branchId!)

  const filtered = products.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSubmit = async () => {
    if (cart.length === 0) return
    Alert.alert(
      'Confirmar venta',
      `Total: $${total.toFixed(2)}\n${cart.length} producto(s)`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cobrar',
          onPress: async () => {
            const ok = await submitSale()
            if (ok) {
              setCartVisible(false)
              Alert.alert('Venta registrada', isOnline ? 'Sincronizada.' : 'Guardada localmente.')
            } else {
              Alert.alert('Error', 'No se pudo registrar la venta.')
            }
          }
        }
      ]
    )
  }

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', onPress: async () => { await logout(); router.replace('/login') } }
    ])
  }

  return (
    <View className='flex-1 bg-gray-50'>
      {/* Header */}
      <View className='bg-white px-4 pt-14 pb-3 flex-row items-center justify-between border-b border-gray-100'>
        <View>
          <Text className='text-lg font-bold text-gray-900'>{branchName}</Text>
          <View className='flex-row items-center gap-1'>
            {isOnline
              ? <Wifi size={12} color='#10b981' />
              : <WifiOff size={12} color='#ef4444' />
            }
            <Text className='text-xs text-gray-400'>{isOnline ? 'En línea' : 'Sin conexión'}</Text>
            {isSyncing && <ActivityIndicator size='small' style={{ marginLeft: 4 }} />}
          </View>
        </View>
        <View className='flex-row gap-2'>
          <TouchableOpacity
            onPress={() => setCartVisible(true)}
            className='relative bg-black rounded-xl px-4 py-2 flex-row items-center gap-2'
          >
            <ShoppingCart size={18} color='white' />
            {cart.length > 0 && (
              <View className='bg-blue-500 rounded-full w-5 h-5 items-center justify-center'>
                <Text className='text-white text-xs font-bold'>{cart.length}</Text>
              </View>
            )}
            <Text className='text-white font-semibold'>${total.toFixed(2)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} className='p-2'>
            <LogOut size={20} color='#6b7280' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View className='px-4 py-3'>
        <TextInput
          className='bg-white border border-gray-200 rounded-xl px-4 py-3'
          placeholder='Buscar producto...'
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Product grid */}
      {isLoading ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
          <Text className='text-gray-400 mt-2'>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.productoId)}
          numColumns={2}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View className='flex-1'>
              <ProductCard
                product={item}
                onAdd={() => addToCart(item)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className='items-center py-20'>
              <Text className='text-gray-400'>
                {search ? 'Sin resultados' : 'Sin productos. Verifica tu conexión.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Cart modal */}
      <Modal visible={cartVisible} animationType='slide' presentationStyle='pageSheet'>
        <View className='flex-1 bg-white'>
          <View className='px-4 pt-6 pb-3 border-b border-gray-100 flex-row items-center justify-between'>
            <Text className='text-xl font-bold'>Carrito</Text>
            <TouchableOpacity onPress={() => setCartVisible(false)}>
              <Text className='text-blue-500 font-medium'>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {cart.length === 0 ? (
            <View className='flex-1 items-center justify-center'>
              <ShoppingCart size={48} color='#d1d5db' />
              <Text className='text-gray-400 mt-3'>El carrito está vacío</Text>
            </View>
          ) : (
            <>
              <ScrollView className='flex-1 px-4'>
                {cart.map(item => (
                  <CartItemRow
                    key={item.productoId}
                    item={item}
                    onAdd={() => addToCart(products.find(p => p.productoId === item.productoId)!)}
                    onRemove={() => removeFromCart(item.productoId)}
                  />
                ))}
              </ScrollView>

              <View className='px-4 py-4 border-t border-gray-100 gap-3'>
                <View className='flex-row justify-between'>
                  <Text className='text-gray-500'>Subtotal</Text>
                  <Text className='font-semibold'>${total.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  className='bg-black rounded-xl py-4 items-center'
                  onPress={handleSubmit}
                >
                  <Text className='text-white font-bold text-lg'>
                    Cobrar ${total.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  )
}
