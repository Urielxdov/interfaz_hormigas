import { GestureResponderEvent, Pressable, Text } from 'react-native'

interface ButtonCustomProps {
  title: string
  onPress: (event: GestureResponderEvent) => void
  bgColor?: string
  disabled?: boolean
}

export default function ButtonCustom ({
  title,
  onPress,
  bgColor = 'bg-blue-500',
  disabled = false
}: ButtonCustomProps) {
  return (
    <Pressable
      className={`${bgColor} p-4 rounded-lg items-center`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className='text-white font-bold text-lg'>{title}</Text>
    </Pressable>
  )
}
