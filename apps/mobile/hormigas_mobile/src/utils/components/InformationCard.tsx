import { type LucideIcon } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { Color } from '../constants/Colors'

interface InformationCardProps {
  title: string
  description: string
  icon: LucideIcon
  iconBgColor: Color
  /** Texto pequeño bajo el valor (ej. "3 sucursales"). */
  hint?: string
  onPress?: () => void
}

/** Fondo suave + color del icono por tono (clases completas para que NativeWind las genere). */
const TONES: Partial<Record<Color, { bg: string; fg: string }>> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', fg: '#2563eb' },
  green: { bg: 'bg-green-50 dark:bg-green-900/30', fg: '#16a34a' },
  yellow: { bg: 'bg-amber-50 dark:bg-amber-900/30', fg: '#d97706' },
  red: { bg: 'bg-red-50 dark:bg-red-900/30', fg: '#dc2626' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', fg: '#9333ea' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/30', fg: '#4f46e5' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', fg: '#ea580c' },
}

/**
 * Tarjeta de metrica: ocupa el ancho de su contenedor (sirve en grilla de 2 o 4 columnas).
 * Antes tenia ancho fijo (10/12) y un icono de 36 px que se desbordaba en media columna.
 */
export default function InformationCard ({
  title,
  description,
  icon: Icon,
  iconBgColor,
  hint,
  onPress,
}: InformationCardProps) {
  const tone = TONES[iconBgColor] ?? { bg: 'bg-stone-100 dark:bg-zinc-800', fg: '#52525b' }
  return (
    <Animated.View entering={FadeIn.duration(300)} className='flex-1'>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className='flex-1 p-3.5 gap-2 border rounded-2xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 active:opacity-80'
      >
        <View className='flex-row items-center gap-2'>
          <View className={`${tone.bg} w-8 h-8 rounded-lg items-center justify-center`}>
            <Icon size={17} color={tone.fg} />
          </View>
          <Text className='flex-1 font-sans-medium text-zinc-500 dark:text-zinc-400 text-xs' numberOfLines={2}>{title}</Text>
        </View>
        <Text className='font-sans-bold text-zinc-900 dark:text-zinc-50 text-2xl' numberOfLines={1} adjustsFontSizeToFit>
          {description}
        </Text>
        {hint ? <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs' numberOfLines={1}>{hint}</Text> : null}
      </Pressable>
    </Animated.View>
  )
}
