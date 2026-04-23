import ButtonCustom from '@/src/utils/components/ButtonCustom'
import Form, { FormFieldConfig } from '@/src/utils/components/Form'
import { ReactNode } from 'react'
import { Control, DefaultValues, FieldErrors, FieldValues, useForm, UseFormWatch } from 'react-hook-form'
import { Text, View } from 'react-native'

interface RenderProps<T extends FieldValues> {
  control: Control<T>
  errors: FieldErrors<T>
  watch: UseFormWatch<T>
}

interface GenericCreateScreenProps<T extends FieldValues> {
  title: string
  subtitle: string
  fields: FormFieldConfig<T>[]
  defaultValues?: DefaultValues<T>
  onSubmit: (data: T) => void
  children?: (props: RenderProps<T>) => ReactNode
}

export default function GenericCreateScreen<T extends FieldValues>({
  title,
  subtitle,
  fields,
  defaultValues,
  onSubmit,
  children
}: GenericCreateScreenProps<T>) {
  const { control, handleSubmit, formState: { errors }, watch } = useForm<T>({ defaultValues })

  return (
    <View className='w-full'>
      <View className='gap-1 p-2'>
        <Text className='text-2xl font-bold'>{title}</Text>
        <Text className='text-gray-500'>{subtitle}</Text>
      </View>
      <Form control={control} errors={errors} fields={fields} scrollable={false}>
        {children?.({ control, errors, watch })}
        <ButtonCustom title='Guardar' onPress={handleSubmit(onSubmit)} />
      </Form>
    </View>
  )
}
