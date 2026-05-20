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
import type { Product } from '@hormigas/domain'
import { getProductService } from '@/src/adapters/productServiceInstance'
import { SearchableSelect } from '@/src/utils/components/SearchableSelect'

type TipoMovimiento = 'ENTRADA' | 'SALIDA'

type FormState = {
  sucursalId: string
  productoId: string
  tipo: TipoMovimiento
  cantidad: string
  referencia: string
}

const EMPTY_FORM: FormState = {
  sucursalId: '',
  productoId: '',
  tipo: 'ENTRADA',
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
  const { movimientos, loading, error, creating, registrar, recargar } = useMovimientos(filterSucursalId)

  const [allProducts, setAllProducts] = useState<Product[]>([])

  useEffect(() => {
    getProductService()
      .then(svc => svc.findAll())
      .then(data => setAllProducts(data))
      .catch(e => console.error('[MovimientosScreen] loadProducts:', e))
  }, [])

  const productOptions = allProducts
    .filter(p => p.categoriaId !== undefined)
    .map(p => ({
      label: p.nombre,
      sublabel: p.sku,
      value: String(p.categoriaId),
    }))

  const branchOptions = branches.map(b => ({ label: b.nombre, value: Number(b.id) }))
  const tipoOptions: { label: string; value: TipoMovimiento }[] = [
    { label: 'Entrada (+)', value: 'ENTRADA' },
    { label: 'Salida (-)', value: 'SALIDA' },
  ]

  const handleRegistrar = async () => {
    if (!form.sucursalId || !form.productoId || !form.cantidad) {
      Alert.alert('Error', 'Sucursal, producto y cantidad son obligatorios')
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
        productoId: Number(form.productoId),
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
          {movimientos.map(m => (
            <View key={m.id} className='bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-2 border border-stone-100 dark:border-zinc-800'>
              <View className='flex-row items-start justify-between'>
                <View className='flex-1'>
                  <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>{m.productoNombre}</Text>
                  <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm mt-0.5'>{m.sucursalNombre}</Text>
                </View>
                <View className={`px-2 py-0.5 rounded-full ${m.tipoMovimiento === 'ENTRADA' ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Text className={`text-xs font-semibold ${m.tipoMovimiento === 'ENTRADA' ? 'text-green-700' : 'text-red-700'}`}>
                    {m.tipoMovimiento === 'ENTRADA' ? `+${m.cantidad}` : `-${m.cantidad}`}
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
          ))}
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
                onChange={v => setForm(p => ({ ...p, sucursalId: String(v) }))}
              />

              <SearchableSelect
                label='Producto'
                placeholder='Buscar producto...'
                options={productOptions}
                value={form.productoId}
                onChange={v => setForm(p => ({ ...p, productoId: v }))}
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
