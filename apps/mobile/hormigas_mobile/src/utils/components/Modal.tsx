import { ReactNode, useEffect, useState } from 'react'
import {
  Modal as NativeModal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { X } from 'lucide-react-native'

type ModalVariant = 'confirm' | 'info'

interface ModalProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  variant?: ModalVariant
  onSubmit?: () => void
  submitTitle?: string
}

export default function Modal({
  children,
  isOpen,
  onClose,
  variant = 'confirm',
  onSubmit,
  submitTitle,
}: ModalProps) {
  const [visible, setVisible] = useState(isOpen)

  useEffect(() => {
    setVisible(isOpen)
  }, [isOpen])

  const handleClose = () => {
    setVisible(false)
    onClose()
  }

  return (
    <NativeModal
      animationType='slide'
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View className='flex-1 items-center justify-center bg-black/60 px-6'>
        <View className='w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-lg max-h-[90%]'>
          <View className='flex w-2/12 mb-2'>
            <Pressable
              onPress={handleClose}
              className='bg-stone-100 dark:bg-zinc-800 p-2 rounded-xl items-center'
            >
              <X size={18} color='#71717a' />
            </Pressable>
          </View>

          <ScrollView
            className='mb-4'
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {children}
          </ScrollView>

          <View className='flex-row justify-end gap-3'>
            {variant === 'info' ? (
              <Pressable
                className='rounded-xl bg-indigo-500 px-5 py-3'
                onPress={handleClose}
              >
                <Text className='font-sans-semibold text-white'>Aceptar</Text>
              </Pressable>
            ) : (
              onSubmit && (
                <Pressable
                  className='rounded-xl bg-indigo-500 px-5 py-3'
                  onPress={onSubmit}
                >
                  <Text className='font-sans-semibold text-white'>
                    {submitTitle ?? 'Confirmar'}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        </View>
      </View>
    </NativeModal>
  )
}
