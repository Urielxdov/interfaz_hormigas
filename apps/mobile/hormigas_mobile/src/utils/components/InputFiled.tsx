import { Ref } from 'react'
import {
  KeyboardTypeOptions,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View
} from 'react-native'

type InputValue = string | number | boolean

interface InputFieldProps {
  label: string
  placeholder?: string
  secureText?: boolean
  value: InputValue
  onChangeText: (value: InputValue) => void
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send'
  onSubmitEditingProp?: () => void
  blurOnSubmitProp?: boolean
  inputRef?: Ref<TextInput>
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: TextInputProps['autoCapitalize']
}

export default function InputField({
  label,
  placeholder,
  secureText = false,
  value,
  onChangeText,
  returnKeyType = 'done',
  onSubmitEditingProp = () => {},
  blurOnSubmitProp = false,
  inputRef,
  keyboardType,
  autoCapitalize,
}: InputFieldProps) {

  // Boolean → Switch
  if (typeof value === 'boolean') {
    return (
      <View className='flex-row items-center justify-between w-full'>
        <Text className='text-left font-sans-medium text-sm text-zinc-700 dark:text-zinc-300'>{label}</Text>
        <Switch
          value={value}
          onValueChange={(val) => onChangeText(val)}
        />
      </View>
    )
  }

  // Number → TextInput con keyboardType numérico
  if (typeof value === 'number') {
    return (
      <View className='flex gap-1 w-full'>
        <Text className='text-left font-sans-medium text-xs text-zinc-700 dark:text-zinc-300'>{label}</Text>
        <TextInput
          ref={inputRef}
          className='w-full px-4 py-3 border border-stone-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-sans text-base'
          placeholderTextColor='#a1a1aa'
          placeholder={placeholder}
          value={String(value)}
          onChangeText={(text) => {
            const parsed = parseFloat(text)
            onChangeText(isNaN(parsed) ? 0 : parsed)
          }}
          keyboardType='numeric'
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditingProp}
          blurOnSubmit={blurOnSubmitProp}
          autoCapitalize={autoCapitalize}
        />
      </View>
    )
  }

  // String → TextInput normal
  return (
    <View className='flex gap-1 w-full'>
      <Text className='text-left font-sans-medium text-xs text-zinc-700 dark:text-zinc-300'>{label}</Text>
      <TextInput
        ref={inputRef}
        className='w-full px-4 py-3 border border-stone-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-sans text-base'
          placeholderTextColor='#a1a1aa'
        placeholder={placeholder}
        secureTextEntry={secureText}
        value={value}
        onChangeText={(text) => onChangeText(text)}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditingProp}
        blurOnSubmit={blurOnSubmitProp}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  )
}