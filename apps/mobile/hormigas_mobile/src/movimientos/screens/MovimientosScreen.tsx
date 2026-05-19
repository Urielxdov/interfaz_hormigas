import { useState } from 'react'
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
    <View className="gap-1">
      <Text className="text-sm font-medium text-gray-700">{label}</Text>
      <TouchableOpacity
        className="border border-gray-200 rounded-lg px-3 py-2.5 flex-row items-center justify-between"
        onPress={() => setOpen(true)}
      >
        <Text className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : placeholder ?? 'Seleccionar...'}
        </Text>
        <ChevronDown size={14} color="#6b7280" />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}}>
            <View className="bg-white rounded-t-2xl max-h-64">
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Text className="font-semibold">{label}</Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <X size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {options.map(opt => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    className={`px-4 py-3 border-b border-gray-50 ${opt.value === value ? 'bg-gray-50' : ''}`}
                    onPress={() => { onChange(opt.value); setOpen(false) }}
                  >
                    <Text className={opt.value === value ? 'font-semibold' : 'text-gray-700'}>
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
    <View className="flex-1 bg-gray-50">
      <View className="w-11/12 self-center mt-4 gap-3">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold">Movimientos</Text>
            <Text className="text-gray-500 text-sm">Historial de entradas y salidas</Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center gap-1 bg-black px-4 py-2 rounded-lg"
            onPress={() => setModalOpen(true)}
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white font-semibold">Registrar</Text>
          </TouchableOpacity>
        </View>

        {/* Filter */}
        <SimpleSelect
          label="Filtrar por sucursal"
          placeholder="Todas las sucursales"
          options={branchOptions}
          value={filterSucursalId ?? ''}
          onChange={v => setFilterSucursalId(v as number)}
        />

        {filterSucursalId != null && (
          <TouchableOpacity onPress={() => setFilterSucursalId(undefined)}>
            <Text className="text-blue-500 text-sm">Ver todas</Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator className="mt-4" />}
        {error && <Text className="text-red-500 text-sm">{error}</Text>}

        {/* List */}
        <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
          {movimientos.length === 0 && !loading && (
            <Text className="text-gray-400 text-center mt-8">Sin movimientos</Text>
          )}
          {movimientos.map(m => (
            <View key={m.id} className="bg-white rounded-xl p-4 mb-2 border border-gray-100">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{m.productoNombre}</Text>
                  <Text className="text-gray-500 text-sm mt-0.5">{m.sucursalNombre}</Text>
                </View>
                <View className={`px-2 py-0.5 rounded-full ${m.tipoMovimiento === 'ENTRADA' ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Text className={`text-xs font-semibold ${m.tipoMovimiento === 'ENTRADA' ? 'text-green-700' : 'text-red-700'}`}>
                    {m.tipoMovimiento === 'ENTRADA' ? `+${m.cantidad}` : `-${m.cantidad}`}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-gray-400 text-xs">{m.usuarioNombre}</Text>
                <Text className="text-gray-400 text-xs">{formatFecha(m.fecha)}</Text>
              </View>
              {m.referencia && (
                <Text className="text-gray-400 text-xs mt-1">Ref: {m.referencia}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Register modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setModalOpen(false)}>
          <Pressable onPress={() => {}}>
            <View className="bg-white rounded-t-2xl p-6 gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold">Nuevo movimiento</Text>
                <TouchableOpacity onPress={() => setModalOpen(false)}>
                  <X size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <SimpleSelect
                label="Sucursal"
                placeholder="Seleccionar sucursal..."
                options={branchOptions}
                value={form.sucursalId ? Number(form.sucursalId) : ''}
                onChange={v => setForm(p => ({ ...p, sucursalId: String(v) }))}
              />

              <View className="gap-1">
                <Text className="text-sm font-medium text-gray-700">ID Producto</Text>
                <TextInput
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900"
                  value={form.productoId}
                  onChangeText={v => setForm(p => ({ ...p, productoId: v }))}
                  keyboardType="numeric"
                  placeholder="Ej. 1"
                />
              </View>

              <SimpleSelect
                label="Tipo de movimiento"
                options={tipoOptions}
                value={form.tipo}
                onChange={v => setForm(p => ({ ...p, tipo: v as TipoMovimiento }))}
              />

              <View className="gap-1">
                <Text className="text-sm font-medium text-gray-700">Cantidad</Text>
                <TextInput
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900"
                  value={form.cantidad}
                  onChangeText={v => setForm(p => ({ ...p, cantidad: v }))}
                  keyboardType="numeric"
                  placeholder="Ej. 10"
                />
              </View>

              <View className="gap-1">
                <Text className="text-sm font-medium text-gray-700">Referencia (opcional)</Text>
                <TextInput
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900"
                  value={form.referencia}
                  onChangeText={v => setForm(p => ({ ...p, referencia: v }))}
                  placeholder="Ej. Compra #001"
                />
              </View>

              <TouchableOpacity
                className="bg-black rounded-lg py-3.5 items-center mt-1"
                onPress={handleRegistrar}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Registrar movimiento</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
