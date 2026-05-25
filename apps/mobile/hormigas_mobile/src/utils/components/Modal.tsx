import { ReactNode, useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal as NativeModal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated'
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
  const [visible, setVisible] = useState(false)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(40)

  useEffect(() => {
    if (isOpen) {
      opacity.value = 0
      translateY.value = 40
      setVisible(true)
      opacity.value = withTiming(1, { duration: 220 })
      translateY.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      })
    }
  }, [isOpen])

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 180 })
    translateY.value = withTiming(
      40,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(setVisible)(false)
          runOnJS(onClose)()
        }
      }
    )
  }

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <NativeModal
      animationType='none'
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }, overlayStyle]}
          className='items-center justify-center px-6'
        >
          <Animated.View
            style={cardStyle}
            className='w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-lg max-h-[90%]'
          >
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
              keyboardShouldPersistTaps='handled'
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
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </NativeModal>
  )
}
