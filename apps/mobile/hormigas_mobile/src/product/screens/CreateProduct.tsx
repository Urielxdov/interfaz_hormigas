import { GenericForm } from '@/src/utils/components/Form/GenericForm'
import { FormFieldConfig } from '@/src/utils/components/Form'
import { Text, TouchableOpacity, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { useState } from 'react'
import { useCategorias } from '@/src/utils/hooks/useCategorias'
import Modal from '@/src/utils/components/Modal'
import { ScrollView } from 'react-native'
import { productoSchema, ProductoInput } from '@hormigas/mobile-shared'

const PRODUCTS_FORM_FIELDS: FormFieldConfig<ProductoInput>[] = [
  { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Laptop Dell XPS 15' },
  { name: 'sku', label: 'SKU', placeholder: 'Ej. LAPTOP-DELL-001', autoCapitalize: 'characters' },
  { name: 'precio', label: 'Precio', placeholder: '0.00', keyboardType: 'decimal-pad' },
  { name: 'estado', label: 'Activo' },
]
// El stock y sus mínimos/máximos se configuran por sucursal en Sucursales > Inventario.

interface CategoryPickerProps {
  value: number | undefined
  label: string
  onSelect: (id: number, nombre: string) => void
  error?: string
}

function CategoryPicker({ value, label, onSelect, error }: CategoryPickerProps) {
  // Solo las activas se pueden asignar; la actual se muestra aunque se haya desactivado.
  const { categorias: todas, activas: categorias, loading } = useCategorias()
  const [open, setOpen] = useState(false)
  const selected = todas.find(c => c.id === value)

  return (
    <View className='gap-1'>
      <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>Categoría *</Text>
      {categorias.length === 0 && !loading ? (
        <View className='border border-orange-200 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3.5 py-3'>
          <Text className='font-sans text-orange-600 dark:text-orange-400 text-sm'>
            No hay categorías activas. Créalas desde Productos › Categorías.
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3.5 py-3 flex-row items-center justify-between bg-white dark:bg-zinc-800'
          onPress={() => setOpen(true)}
          disabled={loading}
        >
          <Text className={`font-sans ${selected ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`}>
            {loading ? 'Cargando...' : selected ? `${selected.nombre}${selected.activo ? '' : ' (inactiva)'}` : 'Seleccionar categoría...'}
          </Text>
          <ChevronDown size={14} color='#a1a1aa' />
        </TouchableOpacity>
      )}
      {error ? <Text className='text-red-500 text-xs mt-0.5 font-sans'>{error}</Text> : null}

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <View className='gap-3'>
          <Text className='font-sans-bold text-lg text-zinc-900 dark:text-zinc-50'>Seleccionar categoría</Text>
          <ScrollView className='max-h-64'>
            {categorias.map(cat => (
              <TouchableOpacity
                key={cat.id}
                className={`px-3 py-3 rounded-xl mb-1 ${cat.id === value ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-stone-50 dark:bg-zinc-800'}`}
                onPress={() => {
                  onSelect(cat.id, cat.nombre)
                  setOpen(false)
                }}
              >
                <Text className={`font-sans ${cat.id === value ? 'font-sans-semibold text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {cat.nombre}
                </Text>
                {cat.descripcion ? (
                  <Text className='font-sans text-zinc-400 text-xs mt-0.5'>{cat.descripcion}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

interface CreateProductScreenProps {
  defaultValues?: Partial<ProductoInput>
  onSubmit?: (data: ProductoInput) => void | Promise<void>
  /** Editar un producto existente (cambia titulos). */
  editing?: boolean
}

export default function CreateProductoScreen ({ defaultValues, onSubmit, editing = false }: CreateProductScreenProps) {
  return (
    <GenericForm<ProductoInput>
      title={editing ? 'Editar producto' : 'Nuevo producto'}
      subtitle={editing ? 'Los cambios se envían al servidor al guardar' : 'Completa los datos del nuevo producto'}
      fields={PRODUCTS_FORM_FIELDS}
      schema={productoSchema as any}
      defaultValues={{ nombre: '', sku: '', precio: '', estado: true, control: false, categoriaId: undefined, ...defaultValues }}
      onSubmit={async data => { await onSubmit?.(data) }}
    >
      {(_control, errors, watch, setValue) => (
        <>
          <CategoryPicker
            value={watch('categoriaId')}
            label='Categoría'
            onSelect={(id, nombre) => {
              setValue('categoriaId', id as any)
              setValue('categoria' as any, nombre as any)
            }}
            error={errors.categoriaId?.message}
          />
        </>
      )}
    </GenericForm>
  )
}
