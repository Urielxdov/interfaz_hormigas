import { View, Text } from 'react-native'
import { CreateInventarioDTO } from '@hormigas/application'

interface Props {
  sucursalId: number
  onSuccess: (dto: CreateInventarioDTO) => Promise<void>
}

export default function CreateInventarioScreen({ sucursalId }: Props) {
  return (
    <View className="p-4">
      <Text className="text-zinc-900 dark:text-zinc-50">Crear inventario — próximamente</Text>
    </View>
  )
}
