import { useRef } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
} from 'react-native'
import { useForm, Controller, FieldValues, DefaultValues, Path } from 'react-hook-form'
import ButtonCustom from './ButtonCustom'
import { X } from 'lucide-react-native'

export interface FormField<T extends FieldValues> {
  /** Key that maps to the form data type */
  name: Path<T>
  label: string
  placeholder?: string
  rules?: Record<string, unknown>
  keyboardType?: TextInput['props']['keyboardType']
  secureTextEntry?: boolean
  multiline?: boolean
}

interface GenericFormModalProps<T extends FieldValues> {
  visible: boolean
  onClose: () => void
  /** Title shown in the modal header */
  title: string
  /** Optional subtitle shown below the title */
  subtitle?: string
  /** Definition of every form field rendered in the modal */
  fields: FormField<T>[]
  /** Default values for the form */
  defaultValues?: DefaultValues<T>
  /** Called with validated form data when the user submits */
  onSubmit: (data: T) => void
  /** Label for the submit button (default: "Guardar") */
  submitLabel?: string
}

export default function GenericFormModal<T extends FieldValues>({
  visible,
  onClose,
  title,
  subtitle,
  fields,
  defaultValues,
  onSubmit,
  submitLabel = 'Guardar',
}: GenericFormModalProps<T>) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<T>({ defaultValues })

  // One ref per field so we can focus the next input programmatically
  const inputRefs = useRef<(TextInput | null)[]>([])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFormSubmit = (data: T) => {
    onSubmit(data)
    reset()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={handleClose}
      >
        {/* Stop touches inside the sheet from closing the modal */}
        <Pressable onPress={() => { }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View className="bg-white rounded-t-3xl">
              {/* Handle bar */}
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 rounded-full bg-gray-300" />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="font-bold text-xl">{title}</Text>
                  {subtitle ? (
                    <Text className="text-gray-500 text-sm">{subtitle}</Text>
                  ) : null}
                </View>
                <ButtonCustom
                  onPress={handleClose}
                  icon={X}
                  iconColor="white"
                  iconSize={18}
                  bgColor="bg-gray-400"
                />
              </View>

              {/* Form fields */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}
              >
                {fields.map((field, index) => {
                  const isLast = index === fields.length - 1
                  const error = errors[field.name as string] as
                    | { message?: string }
                    | undefined

                  return (
                    <View key={String(field.name)} className="gap-1">
                      <Text className="font-bold">{field.label}</Text>
                      <Controller
                        control={control}
                        name={field.name}
                        rules={field.rules}
                        render={({ field: { onChange, value, onBlur } }) => (
                          <TextInput
                            ref={(ref) => {
                              inputRefs.current[index] = ref
                            }}
                            className={`border rounded-xl p-3 ${error ? 'border-red-400' : 'border-gray-200'
                              }`}
                            placeholder={field.placeholder}
                            value={value as string}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            keyboardType={field.keyboardType ?? 'default'}
                            secureTextEntry={field.secureTextEntry}
                            multiline={field.multiline}
                            // Show "next" on all inputs except the last one
                            returnKeyType={isLast ? 'done' : 'next'}
                            onSubmitEditing={() => {
                              if (!isLast) {
                                inputRefs.current[index + 1]?.focus()
                              }
                            }}
                            blurOnSubmit={isLast}
                          />
                        )}
                      />
                      {error?.message ? (
                        <Text className="text-red-500 text-sm">{error.message}</Text>
                      ) : null}
                    </View>
                  )
                })}

                <ButtonCustom
                  title={submitLabel}
                  onPress={handleSubmit(handleFormSubmit)}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
