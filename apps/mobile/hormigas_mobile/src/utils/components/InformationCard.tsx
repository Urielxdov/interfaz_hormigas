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
      className={`flex-row gap-8 p-4 border items-center rounded-xl border-gray-200
        ${isTablet ? 'w-4/12' : 'w-10/12'} justify-between self-center`}
    >
      <View className='flex-col gap-4'>
        <Text className='text-lg'>{title}</Text>
        <Text className='text-3xl'>{description}</Text>
      </View>
      <View className={`${bgClass(iconBgColor, 600)} p-2 rounded-xl`}>
        <Icon size={40} color='white' />
      </View>
    </View>
  )
}
