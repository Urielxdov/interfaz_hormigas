import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert
} from 'react-native'
import { AlertTriangle, XCircle, TrendingUp } from 'lucide-react-native'
import { TipoMovimiento, MovimientoResponseDTO } from '@hormigas/application'
import { useMovimiento } from '@/src/utils/hooks/useMovimiento'
import { useMotivo } from '@/src/utils/hooks/useMotivo'
import AlertCard from '@/src/utils/components/AlertCard'

const TIPOS_COMBO: { label: string; value: TipoMovimiento }[] = [
  { label: 'Ajuste de stock', value: 'AJUSTE' },
  { label: 'Merma', value: 'MERMA' },
  { label: 'Devolución cliente', value: 'DEVOLUCION_CLIENTE' },
  { label: 'Devolución proveedor', value: 'DEVOLUCION_PROVEEDOR' },
]

interface Props {
  sucursalId: number
  inventarioId: number
  productoId: number
  productoNombre: string
  tipoPreseleccionado?: TipoMovimiento
  onSuccess: () => void
}

export default function MovimientoScreen({
  sucursalId,
  inventarioId,
  productoId,
  productoNombre,
  tipoPreseleccionado,
  onSuccess,
}: Props) {
  const [tipo, setTipo] = useState<TipoMovimiento>(tipoPreseleccionado ?? 'VENTA')
  const [cantidad, setCantidad] = useState('')
  const [referencia, setReferencia] = useState('')
  const [motivoId, setMotivoId] = useState<number | null>(null)
  const [alerta, setAlerta] = useState<MovimientoResponseDTO['alerta']>(null)

  const { registrar, loading, error } = useMovimiento()
  const { motivos } = useMotivo()

  const handleSubmit = async () => {
    if (!cantidad || Number(cantidad) <= 0) {
      Alert.alert('Error', 'La cantidad debe ser mayor a 0')
      return
    }
    const result = await registrar({
      sucursalId,
      productoId,
      tipoMovimiento: tipo,
      cantidad: Number(cantidad),
      referencia: referencia || undefined,
      motivoId: motivoId ?? undefined,
    })
    if (result) {
      if (result.alerta) {
        setAlerta(result.alerta)
      } else {
        onSuccess()
      }
    }
  }

  if (alerta) {
    const isCritico = alerta.tipo === 'STOCK_CRITICO'
    const isExcedido = alerta.tipo === 'STOCK_EXCEDIDO'

    return (
      <View className="flex-1 items-center justify-center p-6 gap-4">
        <AlertCard
          title={isCritico ? 'Stock crítico' : isExcedido ? 'Stock excedido' : 'Stock bajo'}
          description={alerta.mensaje}
          icon={isCritico ? XCircle : isExcedido ? TrendingUp : AlertTriangle}
          color={isCritico ? 'red' : isExcedido ? 'orange' : 'yellow'}
        />
        <TouchableOpacity
          onPress={onSuccess}
          className="bg-black rounded-lg py-3 px-6"
        >
          <Text className="text-white font-semibold">Continuar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xl font-bold">Registrar movimiento</Text>
        <Text className="text-gray-500">{productoNombre}</Text>
      </View>

      {/* Botones fijos VENTA / COMPRA */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => setTipo('VENTA')}
          className={`flex-1 py-3 rounded-xl items-center border-2 ${tipo === 'VENTA' ? 'bg-red-500 border-red-500' : 'bg-white border-gray-200'}`}
        >
          <Text className={`font-bold ${tipo === 'VENTA' ? 'text-white' : 'text-gray-700'}`}>Venta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTipo('COMPRA')}
          className={`flex-1 py-3 rounded-xl items-center border-2 ${tipo === 'COMPRA' ? 'bg-green-500 border-green-500' : 'bg-white border-gray-200'}`}
        >
          <Text className={`font-bold ${tipo === 'COMPRA' ? 'text-white' : 'text-gray-700'}`}>Compra</Text>
        </TouchableOpacity>
      </View>

      {/* Combo otros tipos */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Otro tipo</Text>
        <View className="flex-row flex-wrap gap-2">
          {TIPOS_COMBO.map(t => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setTipo(t.value)}
              className={`px-3 py-2 rounded-lg border ${tipo === t.value ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-sm ${tipo === t.value ? 'text-white font-semibold' : 'text-gray-700'}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cantidad */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">
          {tipo === 'AJUSTE' ? 'Cantidad (nuevo valor absoluto)' : 'Cantidad'}
        </Text>
        <TextInput
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
          className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-base"
          placeholder="0"
        />
      </View>

      {/* Motivo (opcional) */}
      {motivos.length > 0 && (
        <View className="gap-1">
          <Text className="text-sm font-medium text-gray-700">Motivo (opcional)</Text>
          <View className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <TouchableOpacity
              onPress={() => setMotivoId(null)}
              className={`px-4 py-3 border-b border-gray-100 ${motivoId === null ? 'bg-blue-50' : ''}`}
            >
              <Text className={motivoId === null ? 'text-blue-600' : 'text-gray-500'}>Sin motivo</Text>
            </TouchableOpacity>
            {motivos
              .filter(m => m.tipoMovimiento === tipo)
              .map(m => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setMotivoId(m.id)}
                  className={`px-4 py-3 border-b border-gray-100 ${motivoId === m.id ? 'bg-blue-50' : ''}`}
                >
                  <Text className={motivoId === m.id ? 'text-blue-600 font-semibold' : 'text-gray-900'}>
                    {m.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      )}

      {/* Referencia */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Referencia (opcional)</Text>
        <TextInput
          value={referencia}
          onChangeText={setReferencia}
          className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-base"
          placeholder="Ej. ticket-001"
        />
      </View>

      {error && <Text className="text-red-500 text-sm">{error}</Text>}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className="bg-black rounded-lg py-3 items-center"
      >
        {loading
          ? <ActivityIndicator color="white" />
          : <Text className="text-white font-semibold">Registrar movimiento</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}
