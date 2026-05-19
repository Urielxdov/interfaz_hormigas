import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { ChevronDown, X } from 'lucide-react-native'

export interface SelectOption {
  label: string
  value: number | string
}

interface SelectFieldProps {
  label: string
  placeholder?: string
  options: SelectOption[]
  value?: number | string | null
  onChange: (value: number | string) => void
  error?: string
}

export default function SelectField ({ label, placeholder, options, value, onChange, error }: SelectFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <View className='gap-1 mb-2'>
      <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>
      <TouchableOpacity
        className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3.5 py-3.5 flex-row items-center justify-between bg-white dark:bg-zinc-800'
        onPress={() => setOpen(true)}
      >
        <Text className={`font-sans ${selected ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`}>
          {selected ? selected.label : (placeholder ?? 'Seleccionar...')}
        </Text>
        <ChevronDown size={16} color='#a1a1aa' />
      </TouchableOpacity>
      {error && <Text className='text-red-500 text-xs font-sans'>{error}</Text>}

      <Modal visible={open} transparent animationType='slide'>
        <Pressable className='flex-1 bg-black/60 justify-end' onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}}>
            <View className='bg-white dark:bg-zinc-900 rounded-t-2xl max-h-96'>
              <View className='flex-row items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-zinc-800'>
                <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50 text-base'>{label}</Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <X size={20} color='#71717a' />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {options.map(opt => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    className={`px-4 py-3.5 border-b border-stone-50 dark:border-zinc-800 ${opt.value === value ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                    onPress={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                  >
                    <Text className={`font-sans text-base ${opt.value === value ? 'font-sans-semibold text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
