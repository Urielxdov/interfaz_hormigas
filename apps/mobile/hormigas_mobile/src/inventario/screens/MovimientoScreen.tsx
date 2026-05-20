import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert
} from 'react-native'
import { CrearMovimientoDTO, MovimientoDTO } from '@hormigas/application'
import { useMovimiento } from '@/src/utils/hooks/useMovimiento'
import { useMotivo } from '@/src/utils/hooks/useMotivo'

type TipoSimple = 'ENTRADA' | 'SALIDA'

interface Props {
  sucursalId: number
  productoId: number
  productoNombre: string
  tipoPreseleccionado?: TipoSimple
  onSuccess: (result: MovimientoDTO | null) => void
}

export default function MovimientoScreen({
  sucursalId,
  productoId,
  productoNombre,
  tipoPreseleccionado,
  onSuccess,
}: Props) {
  const [tipo, setTipo] = useState<TipoSimple>(tipoPreseleccionado ?? 'SALIDA')
  const [cantidad, setCantidad] = useState('')
  const [referencia, setReferencia] = useState('')
  const { registrar, loading, error } = useMovimiento()
  const { motivos } = useMotivo()

  const handleSubmit = async () => {
    const n = Number(cantidad)
    if (!cantidad || n <= 0) {
      Alert.alert('Error', 'La cantidad debe ser mayor a 0')
      return
    }
    try {
      const result = await registrar({
        sucursalId,
        productoId,
        tipoMovimiento: tipo,
        cantidad: n,
        referencia: referencia.trim() || undefined,
      } satisfies CrearMovimientoDTO)
      onSuccess(result)
    } catch {
      // error state set by hook — screen stays visible so user sees the message
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-stone-50 dark:bg-zinc-950"
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <View className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4">
        <Text className="font-sans-bold text-xl text-zinc-900 dark:text-zinc-50">Registrar movimiento</Text>
        <Text className="text-zinc-500 dark:text-zinc-400">{productoNombre}</Text>
      </View>

      {/* Tipo ENTRADA / SALIDA */}
      <View className="flex-row gap-3 px-4">
        {(['SALIDA', 'ENTRADA'] as TipoSimple[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTipo(t)}
            className={`flex-1 py-3 rounded-xl items-center border-2 ${
              tipo === t
                ? t === 'SALIDA' ? 'bg-red-500 border-red-500' : 'bg-green-600 border-green-600'
                : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700'
            }`}
          >
            <Text className={`font-sans-bold ${tipo === t ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
              {t === 'SALIDA' ? 'Venta / Salida' : 'Compra / Entrada'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Cantidad */}
      <View className="gap-1 px-4">
        <Text className="text-sm font-sans-medium text-zinc-700 dark:text-zinc-300">Cantidad</Text>
        <TextInput
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
          className="border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 bg-white dark:bg-zinc-900 text-base text-zinc-900 dark:text-zinc-50"
          placeholder="0"
          placeholderTextColor="#a1a1aa"
        />
      </View>

      {/* Motivos (si existen) */}
      {motivos.length > 0 && (
        <View className="gap-2 px-4">
          <Text className="text-sm font-sans-medium text-zinc-700 dark:text-zinc-300">Motivo (opcional)</Text>
          <View className="flex-row flex-wrap gap-2">
            {motivos.map(m => (
              <TouchableOpacity
                key={m.id}
                className="px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <Text className="text-sm text-zinc-700 dark:text-zinc-300">{m.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Referencia */}
      <View className="gap-1 px-4">
        <Text className="text-sm font-sans-medium text-zinc-700 dark:text-zinc-300">Referencia (opcional)</Text>
        <TextInput
          value={referencia}
          onChangeText={setReferencia}
          className="border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 bg-white dark:bg-zinc-900 text-base text-zinc-900 dark:text-zinc-50"
          placeholder="Ej. ticket-001"
          placeholderTextColor="#a1a1aa"
        />
      </View>

      {error != null && (
        <Text className="text-red-500 text-sm px-4">{error}</Text>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className="bg-indigo-600 rounded-xl py-3 items-center mx-4"
      >
        {loading
          ? <ActivityIndicator color="white" />
          : <Text className="text-white font-sans-semibold">Registrar movimiento</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}
