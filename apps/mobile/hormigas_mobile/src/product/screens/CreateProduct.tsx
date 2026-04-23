import Form, { FormFieldConfig } from '@/src/utils/components/Form'
import GenericCreateScreen from '@/src/utils/components/GenericCreateScreen'
import { CreateProductDTO } from '@hormigas/application'
import { Text, View } from 'react-native'

const PRODUCTS_FORM_FIELDS: FormFieldConfig<CreateProductDTO>[] = [
  {
    name: 'nombre',
    label: 'Nombre',
    placeholder: 'Ej. Laptop Dell XPS 15',
    rules: { required: 'El nombre es obligatorio' }
  },
  {
    name: 'sku',
    label: 'SKU',
    placeholder: 'Ej. SKU-001',
    rules: { required: 'El SKU es obligatorio' }
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
    name: 'estado',
    label: 'Activo'
  },
  {
    name: 'control',
    label: '¿Control de inventario?'
  }
]

const INVENTARIO_FIELDS: FormFieldConfig<CreateProductDTO>[] = [
  {
    name: 'stockMinimo',
    label: 'Stock Mínimo',
    placeholder: '0'
  },
  {
    name: 'stockMaximo',
    label: 'Stock Máximo',
    placeholder: '0'
  }
]

interface CreateProductScreenProps {
  defaultValues?: Partial<CreateProductDTO>
  onSubmit?: (data: CreateProductDTO) => void
}

export default function CreateProductoScreen({ defaultValues, onSubmit: onSubmitProp }: CreateProductScreenProps) {
  return (
    <GenericCreateScreen
      title='Crear Producto'
      subtitle='Completa los datos del nuevo producto'
      fields={PRODUCTS_FORM_FIELDS}
      defaultValues={{ nombre: '', sku: '', categoria: '', precio: 0, estado: true, control: false, ...defaultValues }}
      onSubmit={data => onSubmitProp?.(data)}
    >
      {({ control, errors, watch }) => {
        const controlInventario = watch('control')
        if (!controlInventario) return null
        return (
          <View className='border border-gray-200 rounded-lg p-3 gap-2 bg-blue-100'>
            <Text className='font-semibold text-blue-500 text-2xl'>Control de Inventario</Text>
            <Form control={control} errors={errors} fields={INVENTARIO_FIELDS} scrollable={false} />
          </View>
        )
      }}
    </GenericCreateScreen>
  )
}
