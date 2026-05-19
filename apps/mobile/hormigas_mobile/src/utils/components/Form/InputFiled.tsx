import { Ref, useState } from 'react'
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
  const [focused, setFocused] = useState(false)

  if (typeof value === 'boolean') {
    return (
      <View className='flex-row items-center justify-between w-full mb-2'>
        <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>
        <Switch
          value={value}
          onValueChange={(val) => onChangeText(val)}
          thumbColor='#6366f1'
          trackColor={{ true: '#a5b4fc', false: '#d4d4d8' }}
        />
      </View>
    )
  }

  const borderClass = focused
    ? 'border-indigo-500'
    : 'border-stone-200 dark:border-zinc-700'

  if (typeof value === 'number') {
    return (
      <View className='gap-1 w-full mb-2'>
        <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>
        <TextInput
          ref={inputRef}
          className={`w-full p-3.5 border ${borderClass} rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-sans`}
          placeholder={placeholder}
          placeholderTextColor='#a1a1aa'
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
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    )
  }

  return (
    <View className='gap-1 w-full mb-2'>
      <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>
      <TextInput
        ref={inputRef}
        className={`w-full p-3.5 border ${borderClass} rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-sans`}
        placeholder={placeholder}
        placeholderTextColor='#a1a1aa'
        secureTextEntry={secureText}
        value={value}
        onChangeText={(text) => onChangeText(text)}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditingProp}
        blurOnSubmit={blurOnSubmitProp}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  )
}
