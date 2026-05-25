import ButtonCustom from '@/src/utils/components/ButtonCustom'
import DataTable from '@/src/utils/components/DataTable'
import Modal from '@/src/utils/components/Modal'
import { statusClass } from '@/src/utils/helpers/ColorHerlper'
import useIsTablet from '@/src/utils/hooks/useIsTablet'
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
import { ChevronLeft, ChevronRight, Package, Pencil, Power, BarChart2 } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View, FlatList } from 'react-native'
import { router } from 'expo-router'
import CreateProductoScreen from './CreateProduct'
import InformationCard from '@/src/utils/components/InformationCard'
import Form, { FormFieldConfig } from '@/src/utils/components/Form'
import { useForm } from 'react-hook-form'
import { ProductViewModel } from '@/interfaces/Product'
import { useProducts } from '@/src/utils/hooks/useProducts'
import { useAuth } from '@/src/login/hooks/useAuth'
import { useCategorias } from '@/src/utils/hooks/useCategorias'
import { Tag } from 'lucide-react-native'

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

const PAGE_SIZE = 20

export default function ProductHomeScreen () {
  const { control, formState: {errors}, watch } = useForm<FilterFormValues>({})
  const [modal, setModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductViewModel | null>(null)
  const [page, setPage] = useState(0)
  const { products, toggleStatus, updateProduct, createProduct } = useProducts()
  const { isAdminEmpresa } = useAuth()
  const { categorias } = useCategorias()
  const [filterCat, setFilterCat] = useState<string | null>(null)

  const isTablet = useIsTablet()
  const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
  const paddingH = useResponsiveValue(16, 24, 32)
  const stockTotal = products.reduce((acc, s) => acc + s.stock, 0)

  const filterSku = watch('titleSku')

  const filteredProducts = useMemo(() => {
    let result = products
    if (filterSku) {
      const search = filterSku.toLowerCase()
      result = result.filter(p =>
        p.nombre.toLocaleLowerCase().includes(search) ||
        p.sku.toLocaleLowerCase().includes(search)
      )
    }
    if (filterCat) {
      result = result.filter(p => p.categoria === filterCat)
    }
    return result
  }, [products, filterSku, filterCat])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE)),
    [filteredProducts.length]
  )

  const leakedProducts = useMemo(
    () => filteredProducts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filteredProducts, page]
  )

  const goNext = () => setPage(p => Math.min(p + 1, totalPages - 1))
  const goPrev = () => setPage(p => Math.max(p - 1, 0))

  useEffect(() => { setPage(0) }, [filterSku, filterCat])

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      <ScrollView>
      <View style={{ maxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: paddingH, paddingTop: 16, gap: 8 }}>
        <View
          className={`flex ${
            isTablet
              ? 'flex-row items-center justify-between'
              : 'flex-col gap-2'
          }`}
        >
          <View>
            <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Productos</Text>
            <Text className='font-sans text-zinc-500 dark:text-zinc-400'>
              Gestiona tu catálogo de productos
            </Text>
          </View>
          <View className='flex-row gap-2 items-center'>
            {isAdminEmpresa && (
              <TouchableOpacity
                onPress={() => router.push('/categorias')}
                className='flex-row items-center gap-1.5 px-4 py-3 rounded-xl bg-stone-200 dark:bg-zinc-700 active:opacity-75'
              >
                <Tag size={15} color='#71717a' />
                <Text className='font-sans-semibold text-zinc-700 dark:text-zinc-200 text-base'>Categorías</Text>
              </TouchableOpacity>
            )}
            <ButtonCustom
              title='+ Nuevo Producto'
              onPress={() => {
                setSelectedProduct(null)
                setModal(true)
              }}
            />
          </View>
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

        {categorias.length > 0 && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: null, nombre: 'Todas' }, ...categorias]}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ gap: 6 }}
            renderItem={({ item }) => {
              const active = item.id === null ? filterCat === null : filterCat === item.nombre
              return (
                <TouchableOpacity
                  onPress={() => setFilterCat(item.id === null ? null : item.nombre)}
                  className={`px-3 py-1.5 rounded-full border ${active ? 'bg-indigo-500 border-indigo-500' : 'bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700'}`}
                >
                  <Text className={`font-sans-medium text-sm ${active ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              )
            }}
          />
        )}

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
              render: (_, row) => (
                <View className='flex flex-row gap-2'>
                  <ButtonCustom
                    onPress={() => router.push(`/(product-detail)/${row.id}`)}
                    bgColor='bg-blue-500'
                    icon={BarChart2}
                    iconSize={16}
                    compact
                  />
                  <ButtonCustom
                    onPress={() => {
                      setSelectedProduct(row)
                      setModal(true)
                    }}
                    bgColor='bg-indigo-500'
                    icon={Pencil}
                    iconSize={18}
                    compact
                  />
                  <ButtonCustom
                    onPress={() => { toggleStatus(row.id) }}
                    bgColor={`${row.estado ? 'bg-green-500' : 'bg-red-500'}`}
                    icon={Power}
                    iconSize={18}
                    compact
                  />
                </View>
              )
            }
          ]}
          data={leakedProducts}
        />

        {totalPages > 1 && (
          <View className='flex-row items-center justify-center gap-4 py-3'>
            <TouchableOpacity
              onPress={goPrev}
              disabled={page === 0}
              className={`p-2 rounded-xl border ${page === 0 ? 'border-stone-100 dark:border-zinc-800' : 'border-stone-200 dark:border-zinc-700'}`}
            >
              <ChevronLeft size={18} color={page === 0 ? '#d4d4d8' : '#6366f1'} />
            </TouchableOpacity>
            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>
              Página {page + 1} de {totalPages}
            </Text>
            <TouchableOpacity
              onPress={goNext}
              disabled={page >= totalPages - 1}
              className={`p-2 rounded-xl border ${page >= totalPages - 1 ? 'border-stone-100 dark:border-zinc-800' : 'border-stone-200 dark:border-zinc-700'}`}
            >
              <ChevronRight size={18} color={page >= totalPages - 1 ? '#d4d4d8' : '#6366f1'} />
            </TouchableOpacity>
          </View>
        )}

      </View>
      </ScrollView>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        
      >
        <CreateProductoScreen
          defaultValues={selectedProduct ?? undefined}
          onSubmit={async (data) => {
            if (selectedProduct) {
              await updateProduct({
                ...selectedProduct,
                nombre: data.nombre,
                sku: data.sku,
                categoria: data.categoria,
                precio: data.precio,
                estado: data.estado,
              })
            } else {
              await createProduct({
                ...data,
                control: data.control ?? false,
              })
            }
            setModal(false)
            setSelectedProduct(null)
          }}
        />
      </Modal>
    </View>
  )
}
