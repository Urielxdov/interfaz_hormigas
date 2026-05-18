import { View, Text } from 'react-native'
import { CreateInventarioDTO } from '@hormigas/application'

interface Props {
  sucursalId: number
  onSuccess: (dto: CreateInventarioDTO) => Promise<void>
}

export default function CreateInventarioScreen({ sucursalId, onSuccess }: Props) {
  return <View><Text>CreateInventario placeholder</Text></View>
}
