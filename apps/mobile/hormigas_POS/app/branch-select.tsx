import { useAuth } from '@/context/AuthContext'
import { useSucursales } from '@/hooks/usePOS'
import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native'
import { Building2, LogOut } from 'lucide-react-native'

export default function BranchSelectScreen() {
  const { sucursales, isLoading } = useSucursales()
  const { selectBranch, logout } = useAuth()
  const router = useRouter()

  const handleSelect = async (id: number, name: string) => {
    await selectBranch(id, name)
    router.replace('/(pos)/sale')
  }

  return (
    <View className='flex-1 bg-gray-50'>
      <View className='bg-white px-6 pt-14 pb-4 flex-row items-center justify-between border-b border-gray-100'>
        <View>
          <Text className='text-2xl font-bold text-gray-900'>Selecciona tu sucursal</Text>
          <Text className='text-gray-500 text-sm'>¿Desde dónde estás vendiendo hoy?</Text>
        </View>
        <TouchableOpacity onPress={logout} className='p-2'>
          <LogOut size={22} color='#6b7280' />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
        </View>
      ) : (
        <FlatList
          data={sucursales.filter(s => s.activa)}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className='bg-white rounded-xl p-4 flex-row items-center gap-4 border border-gray-100'
              onPress={() => handleSelect(item.id, item.nombre)}
            >
              <View className='bg-blue-50 rounded-xl p-3'>
                <Building2 size={24} color='#3b82f6' />
              </View>
              <View className='flex-1'>
                <Text className='text-base font-semibold text-gray-900'>{item.nombre}</Text>
                {item.direccion && (
                  <Text className='text-sm text-gray-500'>{item.direccion}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className='flex-1 items-center justify-center py-20'>
              <Text className='text-gray-400'>No hay sucursales disponibles</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
