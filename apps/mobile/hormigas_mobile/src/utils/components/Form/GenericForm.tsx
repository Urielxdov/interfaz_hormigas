import ButtonCustom from '@/src/utils/components/ButtonCustom'
import { useForm, DefaultValues, FieldValues } from 'react-hook-form'
import { Text, View } from 'react-native'
import Form, { FormFieldConfig } from './Form'

interface GenericFormProps<T extends FieldValues> {
  title: string
  subtitle?: string
  fields: FormFieldConfig<T>[]
  defaultValues?: DefaultValues<T>
  onSubmit: (data: T) => void
  submitLabel?: string
  children?: (control: any, errors: any) => React.ReactNode // para subformularios
}

export function GenericForm<T extends FieldValues> ({
  title,
  subtitle,
  fields,
  defaultValues,
  onSubmit,
  submitLabel = 'Guardar',
  children
}: GenericFormProps<T>) {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<T>({ defaultValues })

  return (
    <View className='w-full'>
      <View className='gap-1 p-2'>
        <Text className='text-2xl font-bold'>{title}</Text>
        {subtitle && <Text className='text-gray-500'>{subtitle}</Text>}
      </View>
      <Form
        control={control}
        errors={errors}
        fields={fields}
        scrollable={false}
      >
        {/* render prop para subformularios opcionales */}
        {children?.(control, errors)}
        <ButtonCustom title={submitLabel} onPress={handleSubmit(onSubmit)} />
      </Form>
    </View>
  )
}
