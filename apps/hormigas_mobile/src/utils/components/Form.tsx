import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions
} from 'react-hook-form'
import InputField from '@/src/utils/components/InputFiled'
import { Fragment, ReactNode, useRef } from 'react'
import {
  KeyboardTypeOptions,
  Text,
  TextInput,
  TextInputProps
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

export type FormFieldConfig<T extends FieldValues> = {
  name: Path<T>
  label: string
  placeholder?: string
  rules?: RegisterOptions<T, Path<T>>
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: TextInputProps['autoCapitalize']
  secureTextEntry?: boolean
}

interface FormProps<T extends FieldValues> {
  control: Control<T>
  errors: FieldErrors<T>
  fields: FormFieldConfig<T>[]
  children?: ReactNode
}

export default function Form<T extends FieldValues> ({
  control,
  errors,
  fields,
  children
}: FormProps<T>) {
  const inputRefs = useRef<Record<string, TextInput | null>>({})

  const focusNext = (currentIndex: number) => {
    const nextField = fields[currentIndex + 1]
    if (nextField) {
      inputRefs.current[nextField.name]?.focus()
    }
  }

  return (
    <KeyboardAwareScrollView
      className='p-4'
      style={{ minHeight: 0 }}
      contentContainerStyle={{ gap: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps='handled'
      enableOnAndroid
      extraScrollHeight={20}
    >
      {fields.map((field, index) => {
        const error = errors[field.name] as { message?: string } | undefined
        const isLast = index === fields.length - 1

        return (
          <Fragment key={field.name}>
            <Controller
              control={control}
              name={field.name}
              rules={field.rules}
              render={({ field: { onChange, value } }) => (
                <InputField
                  inputRef={ref => { inputRefs.current[field.name] = ref }}
                  label={field.label}
                  placeholder={field.placeholder}
                  value={String(value ?? '')}
                  onChangeText={onChange}
                  secureText={field.secureTextEntry}
                  keyboardType={field.keyboardType}
                  autoCapitalize={field.autoCapitalize}
                  returnKeyType={isLast ? 'done' : 'next'}
                  onSubmitEditingProp={() => focusNext(index)}
                  blurOnSubmitProp={isLast}
                />
              )}
            />
            {error?.message && (
              <Text className='text-red-500'>{error.message}</Text>
            )}
          </Fragment>
        )
      })}

      {children}
    </KeyboardAwareScrollView>
  )
}
