import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { AlertCircle, ArrowLeft, WifiOff } from 'lucide-react-native'
import SelectField from '@/src/utils/components/SelectField'
import BranchProductCard from '../components/BranchProductCard'
import { useProductDetail } from '../hooks/useProductDetail'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

interface Props {
  localId: string
}

export default function ProductDetailScreen({ localId }: Props) {
  const {
    product,
    movimientos,
    allMovimientos,
    branches,
    branchesWithMovimientos,
    loading,
    notSynced,
    selectedBranchId,
    setSelectedBranchId,
  } = useProductDetail(localId)
  const { isOnline } = useNetwork()

  const branchOptions = [
    { label: 'Todas las sucursales', value: 'todas' as string | number },
    ...branchesWithMovimientos.map(b => ({ label: b.nombre, value: Number(b.id) })),
  ]

  const branchGroups =
    selectedBranchId === 'todas'
      ? branchesWithMovimientos.map(b => ({
          branch: b,
          movimientos: allMovimientos.filter(m => m.sucursalId === Number(b.id)),
        }))
      : []

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      {/* Header */}
      <View className='bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 flex-row items-center gap-3'>
        <TouchableOpacity onPress={() => router.back()} className='p-2 -ml-2 rounded-xl'>
          <ArrowLeft size={20} color='#71717a' />
        </TouchableOpacity>
        <View className='flex-1'>
          <Text
            className='font-sans-bold text-xl text-zinc-900 dark:text-zinc-50'
            numberOfLines={1}
          >
            {product?.nombre ?? 'Producto'}
          </Text>
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs'>
            {product?.sku ?? ''}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* No sincronizado */}
        {notSynced && (
          <View className='bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800 flex-row items-start gap-3'>
            <AlertCircle size={18} color='#d97706' />
            <Text className='font-sans text-amber-800 dark:text-amber-300 text-sm flex-1'>
              Producto no sincronizado. Conecta internet y espera la sincronización para ver datos.
            </Text>
          </View>
        )}

        {/* Sin conexión */}
        {!isOnline && !notSynced && (
          <View className='bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-4 flex-row items-center gap-3'>
            <WifiOff size={16} color='#71717a' />
            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>
              Sin conexión — los datos no se pueden cargar
            </Text>
          </View>
        )}

        {/* Selector de sucursal */}
        {!notSynced && (
          <SelectField
            label='Sucursal'
            options={branchOptions}
            value={selectedBranchId}
            onChange={v => setSelectedBranchId(v === 'todas' ? 'todas' : Number(v))}
          />
        )}

        {/* Loading */}
        {loading && (
          <ActivityIndicator color='#6366f1' style={{ marginTop: 24 }} />
        )}

        {/* Sin movimientos */}
        {!loading && !notSynced && movimientos.length === 0 && isOnline && (
          <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-center mt-8'>
            Sin movimientos registrados para este producto
          </Text>
        )}

        {/* Vista "todas" — una card por sucursal */}
        {!loading && selectedBranchId === 'todas' &&
          branchGroups.map(({ branch, movimientos: branchMovs }) => (
            <BranchProductCard
              key={String(branch.id)}
              sucursalNombre={branch.nombre}
              movimientos={branchMovs}
            />
          ))}

        {/* Vista sucursal específica */}
        {!loading && selectedBranchId !== 'todas' && movimientos.length > 0 && (
          <BranchProductCard
            sucursalNombre={
              branches.find(b => Number(b.id) === selectedBranchId)?.nombre ?? ''
            }
            movimientos={movimientos}
          />
        )}
      </ScrollView>
    </View>
  )
}
