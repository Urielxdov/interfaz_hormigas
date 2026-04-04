import ButtonCustom from '@/src/utils/components/ButtonCustom'
import Form, { FormFieldConfig } from '@/src/utils/components/Form'
import { BranchItemListDTO } from '@hormigas/application'
import { useForm } from 'react-hook-form'
import { Text, View } from 'react-native'

type BranchFormValues = {
  nombre: string
  direccion: string
  responsable: string
  codigo: string
  telefono: string
  ciudad: string
}

const BRANCH_FORM_FIELDS: FormFieldConfig<BranchFormValues>[] = [
  {
    name: 'nombre',
    label: 'Nombre',
    placeholder: 'Ej. Sucursal Centro',
    rules: { required: 'El nombre es obligatorio' }
  },
  {
    name: 'direccion',
    label: 'Direccion',
    placeholder: 'Ej. Av. Principal 123',
    rules: { required: 'La direccion es obligatoria' }
  },
  {
    name: 'responsable',
    label: 'Responsable',
    placeholder: 'Ej. Maria Garcia',
    rules: { required: 'El responsable es obligatorio' }
  },
  {
    name: 'codigo',
    label: 'Codigo',
    placeholder: 'Ej. CENTRO-01'
  },
  {
    name: 'telefono',
    label: 'Telefono',
    placeholder: 'Ej. 555 123 4567'
  },
  {
    name: 'ciudad',
    label: 'Ciudad',
    placeholder: 'Ej. Monterrey'
  }
]

const defaultValues: BranchFormValues = {
  nombre: '',
  direccion: '',
  responsable: '',
  codigo: '',
  telefono: '',
  ciudad: ''
}

interface CreateBranchScreenProps {
  defaultValues?: Partial<BranchItemListDTO>
  onSubmit?: (data: BranchItemListDTO) => void
}

export function CreateBranchScreen ({
  defaultValues,
  onSubmit: OnSubmit
}: CreateBranchScreenProps) {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<BranchFormValues>({
    defaultValues: {
      nombre: '',
      direccion: '',
      responsable: ''
    }
  })

  const onSubmit = (data: BranchFormValues) => {
    console.log(data)
  }

  return (
    <View className='w-full'>
      <View className='gap-1 p-2'>
        <Text className='text-2xl font-bold'>Nueva Sucursal</Text>
        <Text className='text-gray-500'>
          Completa el formulario para crear una nueva sucursal
        </Text>
      </View>

      <Form
        control={control}
        errors={errors}
        fields={BRANCH_FORM_FIELDS}
        scrollable={false}
      >
        <ButtonCustom title='Guardar' onPress={handleSubmit(onSubmit)} />
      </Form>
    </View>
  )
}

export default CreateBranchScreen
