import { useState } from 'react'
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { Tag, Plus, Power, X } from 'lucide-react-native'
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
import { useCategorias } from '@/src/utils/hooks/useCategorias'
import { useErrorModal } from '@/src/utils/hooks/useErrorModal'

export default function CategoriasScreen() {
    const { categorias, loading, error, saving, crear, toggleActivo } = useCategorias()
    const { showError, errorModal } = useErrorModal()
    const [modal, setModal] = useState(false)
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
    const paddingH = useResponsiveValue(16, 24, 32)

    const NOMBRE_MAX = 50
    const DESC_MAX = 200
    const NOMBRE_PATTERN = /^[\p{L}\p{N}\s\-_&/.]+$/u

    const nombreTrimmed = nombre.trim()
    const nombreError =
        !nombreTrimmed ? 'El nombre es obligatorio' :
        nombreTrimmed.length < 2 ? 'Mínimo 2 caracteres' :
        !NOMBRE_PATTERN.test(nombreTrimmed) ? 'Solo letras, números y los caracteres -_&/.' :
        null

    const handleCrear = async () => {
        if (nombreError) {
            showError(nombreError)
            return
        }
        try {
            await crear({ nombre: nombreTrimmed, descripcion: descripcion.trim() || undefined })
            setNombre('')
            setDescripcion('')
            setModal(false)
        } catch (e) {
            showError(e instanceof Error ? e.message : 'No se pudo crear la categoría')
        }
    }

    const handleToggle = async (id: number) => {
        try {
            await toggleActivo(id)
        } catch (e) {
            showError(e instanceof Error ? e.message : 'No se pudo cambiar el estado')
        }
    }

    return (
        <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
            <View style={{ maxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: paddingH }} className='flex-1 mt-4 gap-3'>
                <View className='flex-row items-center justify-between'>
                    <View>
                        <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Categorías</Text>
                        <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>
                            {categorias.length} categorías de tu empresa
                        </Text>
                    </View>
                    <TouchableOpacity
                        className='flex-row items-center gap-1 bg-indigo-500 px-4 py-2 rounded-xl'
                        onPress={() => setModal(true)}
                    >
                        <Plus size={16} color='#fff' />
                        <Text className='text-white font-sans-semibold'>Nueva</Text>
                    </TouchableOpacity>
                </View>

                {loading && <ActivityIndicator className='mt-4' />}
                {error && <Text className='text-red-500 text-sm font-sans'>{error}</Text>}

                <ScrollView showsVerticalScrollIndicator={false} className='mb-4'>
                    {categorias.length === 0 && !loading && (
                        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-center mt-8'>
                            Sin categorías. Crea una para poder asignarla a productos.
                        </Text>
                    )}
                    {categorias.map(cat => (
                        <View
                            key={cat.id}
                            className='bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-2 border border-stone-100 dark:border-zinc-800 flex-row items-center justify-between'
                        >
                            <View className='flex-row items-center gap-3 flex-1'>
                                <View className='w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center'>
                                    <Tag size={14} color='#6366f1' />
                                </View>
                                <View className='flex-1'>
                                    <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>{cat.nombre}</Text>
                                    {cat.descripcion ? (
                                        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs mt-0.5'>{cat.descripcion}</Text>
                                    ) : null}
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleToggle(cat.id)}
                                className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 ${cat.activo ? 'bg-green-100 dark:bg-green-900/30' : 'bg-stone-100 dark:bg-zinc-800'}`}
                            >
                                <Power size={12} color={cat.activo ? '#059669' : '#9ca3af'} />
                                <Text className={`text-xs font-sans-medium ${cat.activo ? 'text-green-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {cat.activo ? 'Activa' : 'Inactiva'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>

            <Modal visible={modal} transparent animationType='slide'>
                <Pressable
                    className='flex-1 bg-black/60 justify-end'
                    onPress={() => setModal(false)}
                >
                    <Pressable onPress={() => {}}>
                        <View className='bg-white dark:bg-zinc-900 rounded-t-2xl p-6 gap-4'>
                            <View className='flex-row items-center justify-between'>
                                <Text className='font-sans-bold text-xl text-zinc-900 dark:text-zinc-50'>Nueva categoría</Text>
                                <TouchableOpacity onPress={() => setModal(false)}>
                                    <X size={20} color='#71717a' />
                                </TouchableOpacity>
                            </View>

                            <View className='gap-1'>
                                <View className='flex-row justify-between items-center'>
                                    <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>Nombre *</Text>
                                    <Text className={`text-xs font-sans ${nombre.length > NOMBRE_MAX ? 'text-red-500' : 'text-zinc-400'}`}>
                                        {nombre.length}/{NOMBRE_MAX}
                                    </Text>
                                </View>
                                <TextInput
                                    className={`border rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans ${nombre.length > 0 && nombreError ? 'border-red-400' : 'border-stone-200 dark:border-zinc-700'}`}
                                    value={nombre}
                                    onChangeText={t => setNombre(t.slice(0, NOMBRE_MAX))}
                                    placeholder='Ej. Electrónica'
                                    placeholderTextColor='#a1a1aa'
                                    maxLength={NOMBRE_MAX}
                                    autoCapitalize='words'
                                />
                                {nombre.length > 0 && nombreError ? (
                                    <Text className='text-red-500 text-xs font-sans'>{nombreError}</Text>
                                ) : null}
                            </View>

                            <View className='gap-1'>
                                <View className='flex-row justify-between items-center'>
                                    <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>Descripción (opcional)</Text>
                                    <Text className={`text-xs font-sans ${descripcion.length > DESC_MAX ? 'text-red-500' : 'text-zinc-400'}`}>
                                        {descripcion.length}/{DESC_MAX}
                                    </Text>
                                </View>
                                <TextInput
                                    className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans'
                                    value={descripcion}
                                    onChangeText={t => setDescripcion(t.slice(0, DESC_MAX))}
                                    placeholder='Ej. Dispositivos electrónicos'
                                    placeholderTextColor='#a1a1aa'
                                    maxLength={DESC_MAX}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>

                            <TouchableOpacity
                                className={`rounded-xl py-3.5 items-center mt-1 ${saving || !!nombreError || descripcion.length > DESC_MAX ? 'bg-indigo-300 dark:bg-indigo-800' : 'bg-indigo-500'}`}
                                onPress={handleCrear}
                                disabled={saving || !!nombreError || descripcion.length > DESC_MAX}
                            >
                                {saving ? (
                                    <ActivityIndicator color='#fff' />
                                ) : (
                                    <Text className='text-white font-sans-semibold text-base'>Crear categoría</Text>
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
