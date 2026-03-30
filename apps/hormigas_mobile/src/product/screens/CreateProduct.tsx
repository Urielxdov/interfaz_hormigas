import ButtonCustom from '@/src/utils/components/ButtonCustom'
import Form, { FormFieldConfig } from '@/src/utils/components/Form'
import { useForm } from 'react-hook-form'
import { Text, View } from 'react-native'

type ProductFormValues = {
  nombre: string
  sku: string
  categoria: string
  precio: number
  activo: boolean
  control: boolean
  // Subformulario
  stockMinimo?: number
  stockMaximo?: number
}

const PRODUCTS_FORM_FIELDS: FormFieldConfig<ProductFormValues>[] = [
  {
    name: 'nombre',
    label: 'Nombre',
    placeholder: 'Ej. Laptop Dell XPS 15',
    rules: { required: 'El nombre es obligatorio' }
  },
  {
    name: 'sku',
    label: 'Direccion',
    placeholder: 'Ej. Av. Principal 123',
    rules: { required: 'La direccion es obligatoria' }
  },
  {
    name: 'categoria',
    label: 'Categoria',
    placeholder: 'Ej. Electronica',
    rules: { required: 'La categoria es obligatoria' }
  },
  {
    name: 'precio',
    label: 'Precio',
    placeholder: '0.00'
  },
  {
    name: 'activo',
    label: 'Activo'
  },
  {
    name: 'control',
    label: '¿Control de inventario?',
    placeholder: 'Ej. Monterrey'
  }
]
const INVENTARIO_FIELDS: FormFieldConfig<ProductFormValues>[] = [
  {
    name: 'stockMinimo',
    label: 'Stock Mínimo',
    placeholder: '0',
  },
  {
    name: 'stockMaximo',
    label: 'Stock Máximo',
    placeholder: '0',
  }
]

const defaultValues: ProductFormValues = {
  nombre: '',
  sku: '',
  categoria: '',
  precio: 0.00,
  activo: true,
  control: false,
  
}

export default function CreateProductoScreen () {
  const { control, handleSubmit, formState: { errors }, watch } = useForm<ProductFormValues>({
    defaultValues
  })
  const controlInventario = watch('control')

  const onSubmit = (data: ProductFormValues) => {
    console.log(data)
  }

  return (
    <View className='w-full'>
      <View className='gap-1 p-2'>
        <Text className='text-2xl font-bold'>Crear Producto</Text>
        <Text className='text-gray-500'>Completa los datos del nuevo producto</Text>
      </View>

      <Form
        control={control}
        errors={errors}
        fields={PRODUCTS_FORM_FIELDS}
        scrollable={false}
      >

        {/* Subformulario — aparece cuando control=true */}
        {controlInventario && (
          <View className='border border-gray-200 rounded-lg p-3 gap-2 bg-blue-100'>
            <Text className='font-semibold text-blue-500 text-2xl'>Control de Inventario</Text>
            <Form
              control={control}   // ← mismo control, mismo useForm
              errors={errors}
              fields={INVENTARIO_FIELDS}
              scrollable={false}
            />
          </View>
        )}

        <ButtonCustom title='Guardar' onPress={handleSubmit(onSubmit)} />
      </Form>
    </View>
  )
}