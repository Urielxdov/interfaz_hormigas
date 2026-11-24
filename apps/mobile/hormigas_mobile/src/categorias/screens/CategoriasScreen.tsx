import { useState } from 'react'
import {
    ActivityIndicator,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { CategoriaDTO } from '@hormigas/application'
import { Tag, Plus, Power, X, Pencil, ArrowLeft } from 'lucide-react-native'
import { router } from 'expo-router'
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
import { useCategorias } from '@/src/utils/hooks/useCategorias'
import { useErrorModal } from '@/src/utils/hooks/useErrorModal'
import { useToast } from '@/src/utils/components/ToastProvider'
import { categoriaSchema } from '@hormigas/mobile-shared'

const NOMBRE_MAX = 50
const DESC_MAX = 200

export default function CategoriasScreen() {
    const { categorias, activas, loading, error, saving, crear, actualizar, toggleActivo, recargar } = useCategorias()
    const { showError, errorModal } = useErrorModal()
    const toast = useToast()
    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<CategoriaDTO | null>(null)
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [toggling, setToggling] = useState<number | null>(null)
    const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
    const paddingH = useResponsiveValue(16, 24, 32)

    const parsed = nombre.length > 0 ? categoriaSchema.safeParse({ nombre, descripcion }) : null
    const duplicada = parsed?.success
        ? categorias.find(c => c.id !== editing?.id && c.nombre.toLowerCase() === parsed.data.nombre.toLowerCase())
        : undefined
    const nombreError = parsed && !parsed.success
        ? parsed.error.flatten().fieldErrors.nombre?.[0] ?? null
        : duplicada
            ? duplicada.activo ? 'Ya existe una categoría con ese nombre' : 'Existe una categoría inactiva con ese nombre: reactívala'
            : null

    const abrir = (cat: CategoriaDTO | null) => {
        setEditing(cat)
        setNombre(cat?.nombre ?? '')
        setDescripcion(cat?.descripcion ?? '')
        setModal(true)
    }

    const cerrar = () => {
        setModal(false)
        setEditing(null)
    }

    const handleGuardar = async () => {
        const result = categoriaSchema.safeParse({ nombre, descripcion })
        if (!result.success) {
            showError(result.error.flatten().fieldErrors.nombre?.[0] ?? 'Datos inválidos')
            return
        }
        if (nombreError) return // ya se muestra bajo el campo
        const dto = { nombre: result.data.nombre, descripcion: result.data.descripcion || undefined }
        try {
            if (editing) {
                await actualizar(editing.id, dto)
                toast.show({ type: 'success', title: 'Categoría actualizada', message: dto.nombre })
            } else {
                await crear(dto)
                toast.show({ type: 'success', title: 'Categoría creada', message: dto.nombre })
            }
            cerrar()
        } catch (e) {
            showError(e instanceof Error ? e.message : 'No se pudo guardar la categoría')
        }
    }

    const handleToggle = async (cat: CategoriaDTO) => {
        setToggling(cat.id)
        try {
            await toggleActivo(cat.id)
            toast.show({
                type: cat.activo ? 'warning' : 'success',
                title: cat.activo ? 'Categoría desactivada' : 'Categoría reactivada',
                message: cat.activo
                    ? `"${cat.nombre}" ya no se podrá asignar a productos nuevos.`
                    : `"${cat.nombre}" vuelve a estar disponible.`,
            })
        } catch (e) {
            showError(e instanceof Error ? e.message : 'No se pudo cambiar el estado')
        } finally {
            setToggling(null)
        }
    }

    const inactivas = categorias.length - activas.length

    return (
        <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
            <View style={{ maxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: paddingH }} className='flex-1 mt-4 gap-3'>
                <View className='flex-row items-center justify-between'>
                    <TouchableOpacity
                        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/products'))}
                        accessibilityLabel='Volver a productos'
                        className='p-2 mr-2 -ml-2'
                    >
                        <ArrowLeft size={22} color='#71717a' />
                    </TouchableOpacity>
                    <View className='flex-1'>
                        <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Categorías</Text>
                        <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>
                            {activas.length} activa{activas.length === 1 ? '' : 's'}
                            {inactivas > 0 ? ` · ${inactivas} inactiva${inactivas === 1 ? '' : 's'}` : ''}
                        </Text>
                    </View>
                    <TouchableOpacity
                        className='flex-row items-center gap-1 bg-indigo-500 px-4 py-2.5 rounded-xl'
                        onPress={() => abrir(null)}
                    >
                        <Plus size={16} color='#fff' />
                        <Text className='text-white font-sans-semibold'>Nueva</Text>
                    </TouchableOpacity>
                </View>

                {error && <Text className='text-red-500 text-sm font-sans'>{error}</Text>}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    className='mb-4'
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={recargar} />}
                >
                    {categorias.length === 0 && !loading && (
                        <View className='items-center mt-10 gap-2 px-6'>
                            <Tag size={32} color='#a1a1aa' />
                            <Text className='font-sans-semibold text-zinc-600 dark:text-zinc-300'>Sin categorías</Text>
                            <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-center text-sm'>
                                Crea una para poder asignarla a tus productos.
                            </Text>
                        </View>
                    )}
                    {categorias.map(cat => (
                        <View
                            key={cat.id}
                            className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-2 border border-stone-100 dark:border-zinc-800 flex-row items-center gap-3 ${cat.activo ? '' : 'opacity-60'}`}
                        >
                            <View className='w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center'>
                                <Tag size={16} color='#6366f1' />
                            </View>
                            <View className='flex-1'>
                                <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50' numberOfLines={1}>{cat.nombre}</Text>
                                <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs mt-0.5' numberOfLines={2}>
                                    {cat.descripcion || 'Sin descripción'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => abrir(cat)}
                                accessibilityLabel={`Editar ${cat.nombre}`}
                                className='p-2 rounded-xl bg-stone-100 dark:bg-zinc-800'
                            >
                                <Pencil size={16} color='#6366f1' />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleToggle(cat)}
                                disabled={toggling === cat.id}
                                accessibilityLabel={cat.activo ? `Desactivar ${cat.nombre}` : `Activar ${cat.nombre}`}
                                className={`px-2.5 py-1.5 rounded-full flex-row items-center gap-1 ${cat.activo ? 'bg-green-100 dark:bg-green-900/30' : 'bg-stone-100 dark:bg-zinc-800'}`}
                            >
                                {toggling === cat.id
                                    ? <ActivityIndicator size='small' color='#6366f1' />
                                    : <Power size={12} color={cat.activo ? '#059669' : '#9ca3af'} />}
                                <Text className={`text-xs font-sans-medium ${cat.activo ? 'text-green-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {cat.activo ? 'Activa' : 'Inactiva'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>

            <Modal visible={modal} transparent animationType='slide' onRequestClose={cerrar}>
                <Pressable className='flex-1 bg-black/60 justify-end' onPress={cerrar}>
                    <Pressable onPress={() => {}}>
                        <View className='bg-white dark:bg-zinc-900 rounded-t-2xl p-6 gap-4'>
                            <View className='flex-row items-center justify-between'>
                                <Text className='font-sans-bold text-xl text-zinc-900 dark:text-zinc-50'>
                                    {editing ? 'Editar categoría' : 'Nueva categoría'}
                                </Text>
                                <TouchableOpacity onPress={cerrar}>
                                    <X size={20} color='#71717a' />
                                </TouchableOpacity>
                            </View>

                            <View className='gap-1'>
                                <View className='flex-row justify-between items-center'>
                                    <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>Nombre *</Text>
                                    <Text className='text-xs font-sans text-zinc-400'>{nombre.length}/{NOMBRE_MAX}</Text>
                                </View>
                                <TextInput
                                    className={`border rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans ${nombre.length > 0 && nombreError ? 'border-red-400' : 'border-stone-200 dark:border-zinc-700'}`}
                                    value={nombre}
                                    onChangeText={t => setNombre(t.slice(0, NOMBRE_MAX))}
                                    placeholder='Ej. Bebidas'
                                    placeholderTextColor='#a1a1aa'
                                    maxLength={NOMBRE_MAX}
                                    autoCapitalize='sentences'
                                />
                                {nombre.length > 0 && nombreError ? (
                                    <Text className='text-red-500 text-xs font-sans'>{nombreError}</Text>
                                ) : null}
                            </View>

                            <View className='gap-1'>
                                <View className='flex-row justify-between items-center'>
                                    <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>Descripción (opcional)</Text>
                                    <Text className='text-xs font-sans text-zinc-400'>{descripcion.length}/{DESC_MAX}</Text>
                                </View>
                                <TextInput
                                    className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans'
                                    value={descripcion}
                                    onChangeText={t => setDescripcion(t.slice(0, DESC_MAX))}
                                    placeholder='Ej. Refrescos, aguas y jugos'
                                    placeholderTextColor='#a1a1aa'
                                    maxLength={DESC_MAX}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>

                            <TouchableOpacity
                                className={`rounded-xl py-3.5 items-center mt-1 ${saving || !!nombreError || nombre.trim().length === 0 ? 'bg-indigo-300 dark:bg-indigo-800' : 'bg-indigo-500'}`}
                                onPress={handleGuardar}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color='#fff' />
                                ) : (
                                    <Text className='text-white font-sans-semibold text-base'>
                                        {editing ? 'Guardar cambios' : 'Crear categoría'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
            {errorModal}
        </View>
    )
}
