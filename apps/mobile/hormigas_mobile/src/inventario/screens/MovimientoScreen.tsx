import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator
} from 'react-native'
import { TIPOS_MANUALES, type CrearMovimientoDTO, type MovimientoDTO, type TipoMovimiento } from '@hormigas/application'
import { useMovimiento } from '@/src/utils/hooks/useMovimiento'
import { movimientoSchema } from '@hormigas/mobile-shared'

/** Direccion elegida en pantalla; lo que se envia es un tipo real del backend (COMPRA, MERMA...). */
type TipoSimple = Extract<TipoMovimiento, 'ENTRADA' | 'SALIDA'>

interface Props {
  sucursalId: number
  inventarioId: number
  productoId: number
  productoNombre: string
  stockActual?: number
  tipoPreseleccionado?: TipoSimple
  onSuccess: (result: MovimientoDTO | null) => void
}

export default function MovimientoScreen({
  sucursalId,
  inventarioId,
  productoId,
  productoNombre,
  stockActual,
  tipoPreseleccionado,
  onSuccess,
}: Props) {
  const [tipo, setTipoDir] = useState<TipoSimple>(tipoPreseleccionado ?? 'SALIDA')
  const opciones = TIPOS_MANUALES.filter(t => t.entrada === (tipo === 'ENTRADA'))
  const [tipoReal, setTipoReal] = useState<TipoMovimiento>(opciones[0]!.tipo)
  const setTipo = (t: TipoSimple) => {
    setTipoDir(t)
    setTipoReal(TIPOS_MANUALES.find(o => o.entrada === (t === 'ENTRADA'))!.tipo)
  }
  const [cantidad, setCantidad] = useState('')
  const [referencia, setReferencia] = useState('')
  const { registrar, loading, error } = useMovimiento()
  const [cantidadError, setCantidadError] = useState<string | null>(null)
  const [referenciaError, setReferenciaError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const result = movimientoSchema.safeParse({ cantidad, referencia })
    const flat = result.success ? {} : result.error.flatten().fieldErrors
    let cantErr = flat.cantidad?.[0] ?? null
    const refErr = (flat as { referencia?: string[] }).referencia?.[0] ?? null
    if (!cantErr && tipo === 'SALIDA' && stockActual !== undefined) {
      const n = parseInt(cantidad, 10)
      if (n > stockActual) cantErr = `Stock insuficiente (disponible: ${stockActual})`
    }
    setCantidadError(cantErr)
    setReferenciaError(refErr)
    if (cantErr || refErr) return
    try {
      const result = await registrar({
        sucursalId,
        productoId,
        inventarioId,
        tipoMovimiento: tipoReal,
        cantidad: parseInt(cantidad, 10),
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
      <View className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 py-4">
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
              {t === 'SALIDA' ? 'Salida' : 'Entrada'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Motivo real del movimiento (tipo que entiende el backend) */}
      <View className="flex-row flex-wrap gap-2 px-4">
        {opciones.map(o => (
          <TouchableOpacity
            key={o.tipo}
            onPress={() => setTipoReal(o.tipo)}
            className={`px-3 py-2 rounded-lg border ${
              tipoReal === o.tipo
                ? 'bg-indigo-500 border-indigo-500'
                : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700'
            }`}
          >
            <Text className={`text-sm font-sans-medium ${tipoReal === o.tipo ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Cantidad */}
      <View className="gap-1 px-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-sans-medium text-zinc-700 dark:text-zinc-300">Cantidad</Text>
          {tipo === 'SALIDA' && stockActual !== undefined && (
            <Text className="text-xs text-zinc-400">Disponible: {stockActual}</Text>
          )}
        </View>
        <TextInput
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
          className="border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 bg-white dark:bg-zinc-900 text-base text-zinc-900 dark:text-zinc-50"
          placeholder="0"
          placeholderTextColor="#a1a1aa"
        />
        {cantidadError && <Text className="text-red-500 text-xs mt-0.5">{cantidadError}</Text>}
      </View>

      {/* Referencia */}
      <View className="gap-1 px-4">
        <Text className="text-sm font-sans-medium text-zinc-700 dark:text-zinc-300">Referencia (opcional)</Text>
        <TextInput
          value={referencia}
          onChangeText={setReferencia}
          maxLength={100}
          className="border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 bg-white dark:bg-zinc-900 text-base text-zinc-900 dark:text-zinc-50"
          placeholder="Ej. ticket-001"
          placeholderTextColor="#a1a1aa"
        />
        {referenciaError && <Text className="text-red-500 text-xs mt-0.5">{referenciaError}</Text>}
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
