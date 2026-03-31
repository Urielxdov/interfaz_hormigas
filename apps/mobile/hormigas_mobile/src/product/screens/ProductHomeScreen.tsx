import ButtonCustom from '@/src/utils/components/ButtonCustom'
import DataTable from '@/src/utils/components/DataTable'
import Modal from '@/src/utils/components/Modal'
import { statusClass } from '@/src/utils/helpers/ColorHerlper'
import useIsTablet from '@/src/utils/hooks/useIsTablet'
import { Package, Pencil, Power } from 'lucide-react-native'
import { useState } from 'react'
import { Text, View } from 'react-native'
import CreateProductoScreen from './CreateProduct'
import InformationCard from '@/src/utils/components/InformationCard'
import Form, { FormFieldConfig } from '@/src/utils/components/Form'
import { useForm } from 'react-hook-form'

const productos = [
  {
    nombre: 'Laptop Dell XPS 15',
    sku: 'LAP-XPS-15',
    categoria: 'Electronica',
    precio: 1299.99,
    stock: 15,
    estado: true,
    acciones: ' '
  },
  {
    nombre: 'Mouse Inalámbrico',
    sku: 'MOU-WRL-01',
    categoria: 'Electronica',
    precio: 1299.99,
    stock: 50,
    estado: true,
    acciones: ' '
  }
]

type FilterFormValues = {
  titleSku: string
}

const FILTERS_FORM_FIELDS: FormFieldConfig<FilterFormValues>[] = [
  {
    name: 'titleSku',
    label: 'Titulo o SKU',
    placeholder: 'Buscar por nombre o SKU'
  }
] 

export default function ProductHomeScreen () {
  const { control, formState: {errors}, watch } = useForm<FilterFormValues>({

  })
  const [modal, setModal] = useState(false)
  const isTablet = useIsTablet()
  const stockTotal = productos.reduce((acc, s) => acc + s.stock, 0)

  const filterSku = watch('titleSku')
  
  const leakedProducts = productos.filter(p => {
    if (!filterSku) return true
    const search = filterSku.toLowerCase()
    return (
      p.nombre.toLocaleLowerCase().includes(search) ||
      p.sku.toLocaleLowerCase().includes(search)
    )
  })

  return (
    <View>
      <View className='w-11/12 self-center gap-2'>
        <View
          className={`flex ${
            isTablet
              ? 'flex-row items-center justify-between'
              : 'flex-col gap-2'
          }`}
        >
          <View>
            <Text className='text-2xl font-bold'>Productos</Text>
            <Text className='text-gray-400'>
              Gestiona tu catálogo de productos
            </Text>
          </View>
          <ButtonCustom
            title='+ Nuevo Producto'
            onPress={() => setModal(true)}
          />
        </View>
        
        <InformationCard
          title='Stock Total'
          description={`${String(stockTotal)} unidades`}
          icon={Package}
          iconBgColor='blue'
        />

        <Form
          control={control}
          errors={errors}
          fields={FILTERS_FORM_FIELDS}
          scrollable={false}
        />

        <DataTable
          title='Productos'
          icon={Package}
          columns={[
            {
              key: 'nombre',
              label: 'Nombre'
            },
            {
              key: 'sku',
              label: 'SKU'
            },
            {
              key: 'categoria',
              label: 'Categoria'
            },
            {
              key: 'precio',
              label: 'Precio'
            },
            {
              key: 'stock',
              label: 'Stock'
            },
            {
              key: 'estado',
              label: 'Estado',
              render: val => (
                <Text className={statusClass(val ? 'blue' : 'gray')}>
                  {val ? 'Activo' : 'Inactivo'}
                </Text>
              )
            },
            {
              key: 'acciones',
              label: 'Acciones',
              render: () => (
                <View className='flex flex-row gap-2'>
                  <View>
                    <Pencil size={30} color='black' />
                  </View>
                  <View>
                    <Power size={30} color='red' />
                  </View>
                </View>
              )
            }
          ]}
          data={leakedProducts}
        />

        
      </View>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
      >
        <CreateProductoScreen />
      </Modal>
    </View>
  )
}
