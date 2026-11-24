import { LucideIcon } from 'lucide-react-native'
import { Pressable, Text } from 'react-native'

type Tone = 'primary' | 'neutral' | 'danger' | 'success'

const TONES: Record<Tone, { bg: string; fg: string; text: string }> = {
  primary: { bg: 'bg-indigo-50 dark:bg-indigo-900/30', fg: '#4f46e5', text: 'text-indigo-700 dark:text-indigo-300' },
  neutral: { bg: 'bg-stone-100 dark:bg-zinc-800', fg: '#52525b', text: 'text-zinc-700 dark:text-zinc-300' },
  danger: { bg: 'bg-red-50 dark:bg-red-900/30', fg: '#dc2626', text: 'text-red-700 dark:text-red-400' },
  success: { bg: 'bg-green-50 dark:bg-green-900/30', fg: '#16a34a', text: 'text-green-700 dark:text-green-400' },
}

interface RowActionProps {
  label: string
  icon: LucideIcon
  onPress: () => void
  tone?: Tone
  disabled?: boolean
}

/** Boton de accion de fila con icono y texto (antes solo iconos de colores sin explicacion). */
export default function RowAction ({ label, icon: Icon, onPress, tone = 'neutral', disabled }: RowActionProps) {
  const t = TONES[tone]
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={label}
      hitSlop={4}
      className={`${t.bg} flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg active:opacity-70 ${disabled ? 'opacity-50' : ''}`}
    >
      <Icon size={14} color={t.fg} />
      <Text className={`font-sans-medium text-xs ${t.text}`}>{label}</Text>
    </Pressable>
  )
}
