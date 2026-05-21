import { useMovimientos } from '@/src/movimientos/hooks/useMovimientos'
import { BranchItemListDTO } from '@hormigas/application'
import { router } from 'expo-router'
import { Activity, Eye, TrendingDown, TrendingUp } from 'lucide-react-native'
import { useMemo } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  branches: BranchItemListDTO[]
}

export default function BranchMovimientosSection({ branches }: Props) {
  const { movimientos, loading } = useMovimientos()

  const statsBySucursal = useMemo(() => {
    const map: Record<number, { entradas: number; salidas: number; total: number }> = {}
    for (const m of movimientos) {
      if (!map[m.sucursalId]) map[m.sucursalId] = { entradas: 0, salidas: 0, total: 0 }
      map[m.sucursalId].total++
      if (m.tipoMovimiento === 'ENTRADA') map[m.sucursalId].entradas++
      else map[m.sucursalId].salidas++
    }
    return map
  }, [movimientos])

  return (
    <View className='gap-3'>
      <View className='flex-row items-center gap-2 px-1'>
        <Activity size={18} color='#6366f1' />
        <Text className='font-sans-bold text-zinc-900 dark:text-zinc-50 text-base'>Actividad por sucursal</Text>
        {loading && <ActivityIndicator size='small' color='#6366f1' />}
      </View>

      {branches.length === 0 && !loading && (
        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-center py-4 text-sm'>
          Sin sucursales registradas
        </Text>
      )}

      {branches.map(branch => {
        const id = Number(branch.id)
        const stats = statsBySucursal[id] ?? { entradas: 0, salidas: 0, total: 0 }
        return (
          <View
            key={String(branch.id)}
            className='bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 overflow-hidden'
          >
            <View className='flex-row items-center justify-between px-4 pt-4 pb-3'>
              <View className='flex-1 gap-0.5'>
                <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>{branch.nombre}</Text>
                <View className='flex-row items-center gap-1.5'>
                  <View className={`w-1.5 h-1.5 rounded-full ${branch.activa ? 'bg-green-500' : 'bg-zinc-400'}`} />
                  <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>
                    {branch.activa ? 'Activa' : 'Inactiva'}
                    {branch.responsable ? ` · ${branch.responsable}` : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(branche)/[sucursalId]/detalle',
                    params: { sucursalId: String(branch.id), sucursalNombre: branch.nombre },
                  })
                }
                className='p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl'
              >
                <Eye size={18} color='#6366f1' />
              </TouchableOpacity>
            </View>

            <View className='flex-row border-t border-stone-50 dark:border-zinc-800'>
              <View className='flex-1 items-center py-3 gap-0.5 border-r border-stone-50 dark:border-zinc-800'>
                <TrendingUp size={13} color='#059669' />
                <Text className='font-sans-bold text-green-700 dark:text-green-400 text-lg leading-tight'>
                  {stats.entradas}
                </Text>
                <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>Entradas</Text>
              </View>
              <View className='flex-1 items-center py-3 gap-0.5 border-r border-stone-50 dark:border-zinc-800'>
                <TrendingDown size={13} color='#dc2626' />
                <Text className='font-sans-bold text-red-700 dark:text-red-400 text-lg leading-tight'>
                  {stats.salidas}
                </Text>
                <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>Salidas</Text>
              </View>
              <View className='flex-1 items-center py-3 gap-0.5'>
                <Activity size={13} color='#6366f1' />
                <Text className='font-sans-bold text-zinc-700 dark:text-zinc-300 text-lg leading-tight'>
                  {stats.total}
                </Text>
                <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>Total</Text>
              </View>
            </View>
          </View>
        )
      })}
    </View>
  )
}
