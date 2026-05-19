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
    <View className='gap-1'>
      <Text className='text-sm font-medium text-gray-700'>{label}</Text>
      <TouchableOpacity
        className='border border-gray-300 rounded-lg px-3 py-3 flex-row items-center justify-between bg-white'
        onPress={() => setOpen(true)}
      >
        <Text className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : (placeholder ?? 'Seleccionar...')}
        </Text>
        <ChevronDown size={16} color='#6b7280' />
      </TouchableOpacity>
      {error && <Text className='text-red-500 text-xs'>{error}</Text>}

      <Modal visible={open} transparent animationType='slide'>
        <Pressable className='flex-1 bg-black/40 justify-end' onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}}>
            <View className='bg-white rounded-t-2xl max-h-96'>
              <View className='flex-row items-center justify-between px-4 py-3 border-b border-gray-100'>
                <Text className='text-base font-semibold'>{label}</Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <X size={20} color='#6b7280' />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {options.map(opt => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    className={`px-4 py-3.5 border-b border-gray-50 ${opt.value === value ? 'bg-gray-50' : ''}`}
                    onPress={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                  >
                    <Text className={`text-base ${opt.value === value ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
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
