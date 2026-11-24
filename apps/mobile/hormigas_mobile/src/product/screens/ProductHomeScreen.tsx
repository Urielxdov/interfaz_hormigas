import ButtonCustom from '@/src/utils/components/ButtonCustom'
import DataTable from '@/src/utils/components/DataTable'
import RowAction from '@/src/utils/components/RowAction'
import { useToast } from '@/src/utils/components/ToastProvider'
import Modal from '@/src/utils/components/Modal'
import useIsTablet from '@/src/utils/hooks/useIsTablet'
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
import { ChevronLeft, ChevronRight, Package, Pencil, Power, BarChart2, CloudOff, Search } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native'
import { router } from 'expo-router'
import CreateProductoScreen from './CreateProduct'
import { ProductViewModel } from '@/interfaces/Product'
import { ProductRejectedError, useProducts } from '@/src/utils/hooks/useProducts'
import { useAuth } from '@/src/login/hooks/useAuth'
import { useCategorias } from '@/src/utils/hooks/useCategorias'
import { Tag } from 'lucide-react-native'
import { useErrorModal } from '@/src/utils/hooks/useErrorModal'
import { DuplicateProductError } from '@hormigas/application'

const PAGE_SIZE = 20

export default function ProductHomeScreen () {
  const [filterSku, setFilterSku] = useState('')
  const [modal, setModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductViewModel | null>(null)
  const [page, setPage] = useState(0)
  const { products, toggleStatus, updateProduct, createProduct } = useProducts()
  const { isAdminEmpresa } = useAuth()
  const { categorias } = useCategorias()
  const [filterCat, setFilterCat] = useState<string | null>(null)

  const { showError, errorModal } = useErrorModal()
  const [reactivateInfo, setReactivateInfo] = useState<{ localId: string; nombre: string } | null>(null)

  const isTablet = useIsTablet()
  const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
  const paddingH = useResponsiveValue(16, 24, 32)
  const toast = useToast()
  const stockTotal = products.reduce((acc, s) => acc + s.stock, 0)
  const activos = products.filter(p => p.estado).length
  const [toggling, setToggling] = useState<string | null>(null)

  const handleToggle = async (row: ProductViewModel) => {
    setToggling(row.id)
    try {
      await toggleStatus(row.id)
      toast.show({
        type: row.estado ? 'warning' : 'success',
        title: row.estado ? 'Producto desactivado' : 'Producto activado',
        message: row.estado ? `"${row.nombre}" ya no aparecerá en el punto de venta.` : `"${row.nombre}" vuelve a estar a la venta.`,
      })
    } catch (e) {
      showError(e instanceof Error ? e.message : 'No se pudo cambiar el estado')
    } finally {
      setToggling(null)
    }
  }


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
        
        <View className='flex-row bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl'>
          {[
            { label: 'Activos', value: activos },
            { label: 'Inactivos', value: products.length - activos },
            { label: 'Unidades en stock', value: stockTotal.toLocaleString('es-MX') },
          ].map((m, i) => (
            <View key={m.label} className={`flex-1 py-3 px-2 items-center ${i > 0 ? 'border-l border-stone-100 dark:border-zinc-800' : ''}`}>
              <Text className='font-sans-bold text-xl text-zinc-900 dark:text-zinc-50'>{m.value}</Text>
              <Text className='font-sans text-xs text-zinc-500 dark:text-zinc-400 text-center'>{m.label}</Text>
            </View>
          ))}
        </View>

        <View className='flex-row items-center gap-2 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 bg-white dark:bg-zinc-900'>
          <Search size={16} color='#a1a1aa' />
          <TextInput
            className='flex-1 py-2.5 font-sans text-zinc-900 dark:text-zinc-50'
            placeholder='Buscar por nombre o SKU'
            placeholderTextColor='#a1a1aa'
            value={filterSku}
            onChangeText={setFilterSku}
            autoCapitalize='none'
          />
        </View>

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

        <DataTable<ProductViewModel>
          title='Productos'
          description={filterCat || filterSku ? `${filteredProducts.length} de ${products.length} coinciden con el filtro` : undefined}
          icon={Package}
          emptyMessage={products.length === 0 ? 'Aún no hay productos. Crea el primero con "+ Nuevo Producto".' : 'Ningún producto coincide con la búsqueda.'}
          keyExtractor={row => row.id}
          columns={[
            {
              key: 'nombre',
              label: 'Nombre',
              primary: true,
              render: (val, row) => (
                <View className='flex-row items-center gap-1.5'>
                  <Text className={`font-sans-semibold text-sm ${row.estado ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}`} numberOfLines={2}>
                    {String(val)}
                  </Text>
                  {!row.synced && <CloudOff size={13} color='#d97706' accessibilityLabel='Cambios sin enviar' />}
                </View>
              ),
            },
            { key: 'sku', label: 'SKU', secondary: true },
            {
              key: 'categoria',
              label: 'Categoría',
              render: val => (
                <Text className={`font-sans text-sm ${val ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 italic'}`} numberOfLines={1}>
                  {val ? String(val) : 'Sin categoría'}
                </Text>
              ),
            },
            {
              key: 'precio',
              label: 'Precio',
              align: 'right',
              render: val => (
                <Text className='font-sans-medium text-sm text-zinc-800 dark:text-zinc-200'>
                  ${Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              ),
            },
            {
              key: 'stock',
              label: 'Stock',
              align: 'right',
              render: val => {
                const n = Number(val)
                return (
                  <Text className={`font-sans-semibold text-sm ${n <= 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {n <= 0 ? 'Sin stock' : `${n.toLocaleString('es-MX')} u.`}
                  </Text>
                )
              },
            },
            {
              key: 'estado',
              label: 'Estado',
              badge: true,
              render: val => (
                <View className={`rounded-full px-2 py-0.5 self-start ${val ? 'bg-green-100 dark:bg-green-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  <Text className={`font-sans-semibold text-xs ${val ? 'text-green-700 dark:text-green-400' : 'text-zinc-500'}`}>
                    {val ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              )
            },
            {
              key: 'acciones',
              label: 'Acciones',
              actions: true,
              render: (_, row) => (
                <View className='flex-row flex-wrap justify-end gap-1.5'>
                  <RowAction
                    label='Gráficas'
                    icon={BarChart2}
                    tone='primary'
                    onPress={() => router.push(`/(product-detail)/${row.id}`)}
                  />
                  {isAdminEmpresa && (
                    <>
                      <RowAction
                        label='Editar'
                        icon={Pencil}
                        onPress={() => {
                          setSelectedProduct(row)
                          setModal(true)
                        }}
                      />
                      <RowAction
                        label={row.estado ? 'Desactivar' : 'Activar'}
                        icon={Power}
                        tone={row.estado ? 'danger' : 'success'}
                        disabled={toggling === row.id}
                        onPress={() => handleToggle(row)}
                      />
                    </>
                  )}
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
          key={selectedProduct?.id ?? 'nuevo'}
          editing={!!selectedProduct}
          defaultValues={selectedProduct
            ? {
                nombre: selectedProduct.nombre,
                sku: selectedProduct.sku,
                precio: selectedProduct.precio.toFixed(2),
                estado: selectedProduct.estado,
                categoriaId: selectedProduct.categoriaId,
              }
            : undefined}
          onSubmit={async (input) => {
            // El formulario ya valido con zod: precio como texto y SKU sin normalizar
            const precio = parseFloat(String(input.precio))
            const sku = input.sku.trim().toUpperCase()
            const nombre = input.nombre.trim()
            const categoria = (input as { categoria?: string }).categoria ?? selectedProduct?.categoria ?? ''
            try {
              if (selectedProduct) {
                await updateProduct({
                  ...selectedProduct,
                  nombre,
                  sku,
                  categoria,
                  categoriaId: input.categoriaId,
                  precio,
                  estado: input.estado ?? true,
                })
                toast.show({ type: 'success', title: 'Producto actualizado', message: nombre })
              } else {
                await createProduct({
                  nombre,
                  sku,
                  precio,
                  categoria,
                  categoriaId: input.categoriaId,
                  estado: input.estado ?? true,
                  control: false,
                })
                toast.show({ type: 'success', title: 'Producto creado', message: `${nombre} · ${sku}` })
              }
              setModal(false)
              setSelectedProduct(null)
            } catch (e) {
              if (e instanceof ProductRejectedError) {
                setModal(false)
                setSelectedProduct(null)
                showError(`El servidor rechazó el cambio: ${e.message}`)
                return
              }
              if (e instanceof DuplicateProductError) {
                setModal(false)
                setSelectedProduct(null)
                if (!e.existing.activo) {
                  setReactivateInfo({ localId: e.existing.localId, nombre: e.existing.nombre })
                } else {
                  showError(
                    e.field === 'sku'
                      ? `Ya existe un producto activo con el SKU "${e.existing.sku}".`
                      : `Ya existe un producto activo con el nombre "${e.existing.nombre}".`
                  )
                }
              } else {
                showError(e instanceof Error ? e.message : 'No se pudo guardar el producto')
              }
            }
          }}
        />
      </Modal>

      <Modal
        isOpen={reactivateInfo !== null}
        onClose={() => setReactivateInfo(null)}
        variant='confirm'
        onSubmit={async () => {
            if (reactivateInfo) {
                try {
                    await toggleStatus(reactivateInfo.localId)
                    toast.show({ type: 'success', title: 'Producto reactivado', message: reactivateInfo.nombre })
                } catch (e) {
                    showError(e instanceof Error ? e.message : 'No se pudo reactivar')
                }
                setReactivateInfo(null)
            }
        }}
        submitTitle='Reactivar'
      >
        <View className='gap-2'>
            <Text className='font-sans-bold text-lg text-zinc-900 dark:text-zinc-50'>Producto inactivo</Text>
            <Text className='font-sans text-zinc-600 dark:text-zinc-400 text-sm leading-5'>
                El producto "{reactivateInfo?.nombre}" existe pero está inactivo. ¿Deseas reactivarlo?
            </Text>
        </View>
      </Modal>
      {errorModal}
    </View>
  )
}
