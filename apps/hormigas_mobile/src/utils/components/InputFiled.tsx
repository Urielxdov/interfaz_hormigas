import { Ref } from 'react'
import {
  KeyboardTypeOptions,
  Text,
  TextInput,
  TextInputProps,
  View
} from 'react-native'

interface InputFieldProps {
  label: string
  placeholder?: string
  secureText?: boolean
  value: string
  onChangeText: (text: string) => void
  returnKeyType: 'done' | 'next' | 'go' | 'search' | 'send'
  onSubmitEditingProp: () => void
  blurOnSubmitProp?: boolean
  inputRef?: Ref<TextInput>
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: TextInputProps['autoCapitalize']
}

export default function InputField ({
  label,
  placeholder,
  secureText = false,
  value,
  onChangeText,
  returnKeyType,
  onSubmitEditingProp,
  blurOnSubmitProp = false,
  inputRef,
  keyboardType,
  autoCapitalize
}: InputFieldProps) {
  return (
    <View className='flex gap-1 w-full'>
      <Text className='text-left text-gray-700 font-semibold'>{label}</Text>
      <TextInput
        ref={inputRef}
        className='w-full mb-4 p-4 border border-gray-300 rounded-lg bg-white'
        placeholder={placeholder}
        secureTextEntry={secureText}
        value={value}
        onChangeText={onChangeText}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditingProp}
        blurOnSubmit={blurOnSubmitProp}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  )
}
