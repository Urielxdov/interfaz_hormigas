import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { ChevronDown, Plus, X } from 'lucide-react-native'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { useMovimientos } from '@/src/movimientos/hooks/useMovimientos'
import { getInventarioRepos } from '@/src/adapters/inventarioServiceInstance'
import { SearchableSelect } from '@/src/utils/components/SearchableSelect'
import type { InventarioItemDTO, TipoMovimiento } from '@hormigas/application'

const TIPOS_SALIDA = new Set<TipoMovimiento>(['VENTA', 'MERMA', 'TRASLADO_SALIDA'])
const esTipoSalida = (tipo: TipoMovimiento) => TIPOS_SALIDA.has(tipo)

type FormState = {
  sucursalId: string
  inventarioId: string
  tipo: TipoMovimiento
  cantidad: string
  referencia: string
}

const EMPTY_FORM: FormState = {
  sucursalId: '',
  inventarioId: '',
  tipo: 'COMPRA',
  cantidad: '',
  referencia: '',
}

function SimpleSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string
  value: T | ''
  options: { label: string; value: T }[]
  onChange: (v: T) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <View className='gap-1'>
      <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>
      <TouchableOpacity
        className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3.5 py-3 flex-row items-center justify-between bg-white dark:bg-zinc-800'
        onPress={() => setOpen(true)}
      >
        <Text className={`font-sans ${selected ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`}>
          {selected ? selected.label : placeholder ?? 'Seleccionar...'}
        </Text>
        <ChevronDown size={14} color='#a1a1aa' />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType='slide'>
        <Pressable className='flex-1 bg-black/60 justify-end' onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}}>
            <View className='bg-white dark:bg-zinc-900 rounded-t-2xl max-h-64'>
              <View className='flex-row items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-zinc-800'>
                <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>{label}</Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <X size={18} color='#71717a' />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {options.map(opt => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    className={`px-4 py-3 border-b border-stone-50 dark:border-zinc-800 ${opt.value === value ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                    onPress={() => { onChange(opt.value); setOpen(false) }}
                  >
                    <Text className={`font-sans ${opt.value === value ? 'font-sans-semibold text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

export default function MovimientosScreen() {
  const [filterSucursalId, setFilterSucursalId] = useState<number | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const { branches } = useBranches()
  const { movimientos, loading, error, creating, registrar } = useMovimientos(filterSucursalId)

  const [inventarios, setInventarios] = useState<InventarioItemDTO[]>([])
  const [loadingInventarios, setLoadingInventarios] = useState(false)

  useEffect(() => {
    if (!form.sucursalId) {
      setInventarios([])
      return
    }
    let cancelled = false
    setLoadingInventarios(true)
    getInventarioRepos()
      .then(({ api }) => api.listarPorSucursal(Number(form.sucursalId)))
      .then(data => { if (!cancelled) { setInventarios(data); setLoadingInventarios(false) } })
      .catch(e => { if (!cancelled) { console.error('[MovimientosScreen] loadInventarios:', e); setLoadingInventarios(false) } })
    return () => { cancelled = true }
  }, [form.sucursalId])

  const inventarioOptions = inventarios
    .map(i => ({
      label: i.productoNombre,
      sublabel: `stock ${i.stockActual}`,
      value: String(i.id),
    }))

  const branchOptions = branches.map(b => ({ label: b.nombre, value: Number(b.id) }))
  const tipoOptions: { label: string; value: TipoMovimiento }[] = [
    { label: 'Compra', value: 'COMPRA' },
    { label: 'Venta', value: 'VENTA' },
    { label: 'Ajuste', value: 'AJUSTE' },
    { label: 'Merma', value: 'MERMA' },
    { label: 'Devolucion', value: 'DEVOLUCION' },
    { label: 'Traslado salida', value: 'TRASLADO_SALIDA' },
    { label: 'Traslado entrada', value: 'TRASLADO_ENTRADA' },
  ]

  const handleRegistrar = async () => {
    if (!form.sucursalId || !form.inventarioId || !form.cantidad) {
      Alert.alert('Error', 'Sucursal, inventario y cantidad son obligatorios')
      return
    }
    const cantidad = parseInt(form.cantidad, 10)
    if (isNaN(cantidad) || cantidad <= 0) {
      Alert.alert('Error', 'Cantidad debe ser un número positivo')
      return
    }
    try {
      await registrar({
        sucursalId: Number(form.sucursalId),
        inventarioId: Number(form.inventarioId),
        tipoMovimiento: form.tipo,
        cantidad,
        referencia: form.referencia || undefined,
      })
      setForm(EMPTY_FORM)
      setModalOpen(false)
    } catch {
      Alert.alert('Error', 'No se pudo registrar el movimiento')
    }
  }

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return fecha }
  }

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      <View className='w-11/12 self-center mt-4 gap-3'>
        <View className='flex-row items-center justify-between'>
          <View>
            <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Movimientos</Text>
            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>Historial de entradas y salidas</Text>
          </View>
          <TouchableOpacity
            className='flex-row items-center gap-1 bg-indigo-500 px-4 py-2 rounded-xl'
            onPress={() => setModalOpen(true)}
          >
            <Plus size={16} color='#fff' />
            <Text className='text-white font-sans-semibold'>Registrar</Text>
          </TouchableOpacity>
        </View>

        <SimpleSelect
          label='Filtrar por sucursal'
          placeholder='Todas las sucursales'
          options={branchOptions}
          value={filterSucursalId ?? ''}
          onChange={v => setFilterSucursalId(v as number)}
        />

        {filterSucursalId != null && (
          <TouchableOpacity onPress={() => setFilterSucursalId(undefined)}>
            <Text className='text-indigo-500 dark:text-indigo-400 text-sm font-sans'>Ver todas</Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator className='mt-4' />}
        {error && <Text className='text-red-500 text-sm font-sans'>{error}</Text>}

        <ScrollView showsVerticalScrollIndicator={false} className='mb-4'>
          {movimientos.length === 0 && !loading && (
            <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-center mt-8'>Sin movimientos</Text>
          )}
          {movimientos.map(m => {
            const esSalida = esTipoSalida(m.tipoMovimiento)
            return (
              <View key={m.id} className='bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-2 border border-stone-100 dark:border-zinc-800'>
                <View className='flex-row items-start justify-between'>
                  <View className='flex-1'>
                    <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>{m.productoNombre}</Text>
                    <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm mt-0.5'>{m.sucursalNombre}</Text>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full ${esSalida ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Text className={`text-xs font-semibold ${esSalida ? 'text-red-700' : 'text-green-700'}`}>
                      {esSalida ? `-${m.cantidad}` : `+${m.cantidad}`}
                    </Text>
                  </View>
                </View>
                <View className='flex-row items-center justify-between mt-2'>
                  <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>{m.usuarioNombre}</Text>
                  <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>{formatFecha(m.fecha)}</Text>
                </View>
                {m.referencia && (
                  <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs mt-1'>Ref: {m.referencia}</Text>
                )}
              </View>
            )
          })}
        </ScrollView>
      </View>

      <Modal visible={modalOpen} transparent animationType='slide'>
        <Pressable className='flex-1 bg-black/60 justify-end' onPress={() => setModalOpen(false)}>
          <Pressable onPress={() => {}}>
            <View className='bg-white dark:bg-zinc-900 rounded-t-2xl p-6 gap-4'>
              <View className='flex-row items-center justify-between'>
                <Text className='font-sans-bold text-xl text-zinc-900 dark:text-zinc-50'>Nuevo movimiento</Text>
                <TouchableOpacity onPress={() => setModalOpen(false)}>
                  <X size={20} color='#71717a' />
                </TouchableOpacity>
              </View>

              <SimpleSelect
                label='Sucursal'
                placeholder='Seleccionar sucursal...'
                options={branchOptions}
                value={form.sucursalId ? Number(form.sucursalId) : ''}
                onChange={v => setForm(p => ({ ...p, sucursalId: String(v), inventarioId: '' }))}
              />

              <SearchableSelect
                label='Inventario'
                placeholder={form.sucursalId ? 'Buscar producto en inventario...' : 'Selecciona una sucursal primero'}
                options={inventarioOptions}
                value={form.inventarioId}
                onChange={v => setForm(p => ({ ...p, inventarioId: String(v) }))}
                emptyMessage={loadingInventarios ? 'Cargando inventario...' : 'Sin inventario para esta sucursal'}
              />

              <SimpleSelect
                label='Tipo de movimiento'
                options={tipoOptions}
                value={form.tipo}
                onChange={v => setForm(p => ({ ...p, tipo: v as TipoMovimiento }))}
              />

              <View className='gap-1'>
                <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>Cantidad</Text>
                <TextInput
                  className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans'
                  value={form.cantidad}
                  onChangeText={v => setForm(p => ({ ...p, cantidad: v }))}
                  keyboardType='numeric'
                  placeholder='Ej. 10'
                  placeholderTextColor='#a1a1aa'
                />
              </View>

              <View className='gap-1'>
                <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>Referencia (opcional)</Text>
                <TextInput
                  className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans'
                  value={form.referencia}
                  onChangeText={v => setForm(p => ({ ...p, referencia: v }))}
                  placeholder='Ej. Compra #001'
                  placeholderTextColor='#a1a1aa'
                />
              </View>

              <TouchableOpacity
                className='bg-indigo-500 rounded-xl py-3.5 items-center mt-1'
                onPress={handleRegistrar}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color='#fff' />
                ) : (
                  <Text className='text-white font-sans-semibold text-base'>Registrar movimiento</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
