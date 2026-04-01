import { LucideIcon } from 'lucide-react-native'
import { GestureResponderEvent, Pressable, Text } from 'react-native'
import { Color } from '../constants/Colors'

interface ButtonCustomProps {
  title?: string
  onPress: (event: GestureResponderEvent) => void
  bgColor?: string
  disabled?: boolean
  icon?: LucideIcon
  iconColor?: Color
  iconSize?: number,
  compact?: boolean
}

export default function ButtonCustom ({
  title = '',
  onPress,
  bgColor = 'bg-blue-500',
  disabled = false,
  icon: Icon,
  iconColor = 'white',
  iconSize = 20,
  compact = false
}: ButtonCustomProps) {
  return (
    <Pressable
      className={`${bgColor} ${compact ? 'p-2' : 'p-4'} rounded-lg items-center`}
      onPress={onPress}
      disabled={disabled}
    >
      {Icon && <Icon size={iconSize} color={iconColor}/>}
      {title && <Text className='text-white font-bold text-lg'>{title}</Text>}
    </Pressable>
  )
}
