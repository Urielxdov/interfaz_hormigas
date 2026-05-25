import { useState } from 'react'
import { Text, View } from 'react-native'
import Modal from '@/src/utils/components/Modal'

export function useErrorModal() {
  const [message, setMessage] = useState<string | null>(null)

  const showError = (msg: string) => setMessage(msg)

  const errorModal = (
    <Modal isOpen={message !== null} onClose={() => setMessage(null)} variant='info'>
      <View className='gap-2 pb-2'>
        <Text className='font-sans-bold text-lg text-zinc-900 dark:text-zinc-50'>Error</Text>
        <Text className='font-sans text-zinc-600 dark:text-zinc-400 text-sm leading-5'>
          {message ?? ''}
        </Text>
      </View>
    </Modal>
  )

  return { showError, errorModal }
}
