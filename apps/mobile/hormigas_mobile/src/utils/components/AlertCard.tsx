import { type LucideIcon } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { Color } from '../constants/Colors'
import { bgClass, borderClass, textClass } from '../helpers/ColorHerlper'

interface AlertCardProps {
  title: string
  description: string
  icon: LucideIcon
  color: Color
}

export default function AlertCard ({
  title,
  description,
  icon: Icon,
  color
}: AlertCardProps) {
  return (
    <View
      className={`flex-row w-11/12 self-center border items-center rounded-xl p-3 gap-2 ${borderClass(
        color,
        300
      )} ${bgClass(color, 200)}`}
    >
      <Icon size={40} className={`${textClass(color, 600)}`} />
      <View className='flex-1'>
        <Text className='font-sans-bold text-zinc-900 dark:text-zinc-50 text-xl'>{title}</Text>
        <Text className='font-sans text-zinc-500 dark:text-zinc-400'>{description}</Text>
      </View>
    </View>
  )
}
