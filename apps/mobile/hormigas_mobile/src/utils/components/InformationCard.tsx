import { type LucideIcon } from 'lucide-react-native'
import { Text, View } from 'react-native'
import useIsTablet from '../hooks/useIsTablet'
import { Color } from '../constants/Colors'
import { bgClass } from '../helpers/ColorHerlper'

interface InformationCardProps {
  title: string
  description: string
  icon: LucideIcon
  iconBgColor: Color
}

export default function InformationCard ({
  title,
  description,
  icon: Icon,
  iconBgColor
}: InformationCardProps) {
  const isTablet = useIsTablet()
  return (
    <View
      className={`flex-row gap-8 p-4 border items-center rounded-2xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900
        ${isTablet ? 'w-4/12' : 'w-10/12'} justify-between self-center`}
    >
      <View className='flex-col gap-2'>
        <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>{title}</Text>
        <Text className='font-sans-bold text-zinc-900 dark:text-zinc-50 text-3xl'>{description}</Text>
      </View>
      <View className={`${bgClass(iconBgColor, 600)} p-3 rounded-xl`}>
        <Icon size={36} color='white' />
      </View>
    </View>
  )
}
