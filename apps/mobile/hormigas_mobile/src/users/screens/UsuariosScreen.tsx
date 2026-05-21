import { useAuth } from '@/src/login/hooks/useAuth'
import { useUsuarios } from '@/src/users/hooks/useUsuarios'
import { statusClass } from '@/src/utils/helpers/ColorHerlper'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { UserPlus, Users, X } from 'lucide-react-native'

type FormState = {
    nombre: string
    correo: string
    password: string
    sucursalId: string
}

const EMPTY: FormState = { nombre: '', correo: '', password: '', sucursalId: '' }

export default function UsuariosScreen() {
    const { usuarios, loading, error, creating, crear, recargar } = useUsuarios()
    const { isAdminEmpresa } = useAuth()
    const [modal, setModal] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY)

    const handleCrear = async () => {
        if (!form.nombre || !form.correo || !form.password) {
            Alert.alert('Error', 'Nombre, correo y contraseña son obligatorios')
            return
        }
        try {
            await crear({
                nombre: form.nombre,
                correo: form.correo,
                password: form.password,
                sucursalId: form.sucursalId ? Number(form.sucursalId) : null,
            })
            setForm(EMPTY)
            setModal(false)
        } catch {
            Alert.alert('Error', 'No se pudo crear el usuario')
        }
    }

    return (
        <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
            <View className='w-11/12 self-center mt-4 gap-2'>
                <View className='flex-row items-center justify-between'>
                    <View>
                        <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Usuarios</Text>
                        <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>{usuarios.length} en esta empresa</Text>
                    </View>
                    {isAdminEmpresa && (
                        <TouchableOpacity
                            className='flex-row items-center gap-1 bg-indigo-500 px-4 py-2 rounded-xl'
                            onPress={() => setModal(true)}
                        >
                            <UserPlus size={16} color='#fff' />
                            <Text className='text-white font-sans-semibold'>Nuevo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {loading && <ActivityIndicator className='mt-4' />}
                {error && <Text className='text-red-500 text-sm font-sans mt-2'>{error}</Text>}

                <ScrollView className='mt-2' showsVerticalScrollIndicator={false}>
                    {usuarios.map(u => (
                        <View
                            key={u.id}
                            className='bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-3 border border-stone-100 dark:border-zinc-800'
                        >
                            <View className='flex-row items-center justify-between'>
                                <View className='flex-row items-center gap-2'>
                                    <Users size={18} color='#6366f1' />
                                    <Text className='font-sans-semibold text-base text-zinc-900 dark:text-zinc-50'>{u.name}</Text>
                                </View>
                                <Text className={statusClass(u.activo ? 'green' : 'gray')}>
                                    {u.activo ? 'Activo' : 'Inactivo'}
                                </Text>
                            </View>
                            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm mt-1'>{u.correo}</Text>
                            {u.sucursalId && (
                                <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs mt-1'>Sucursal ID: {u.sucursalId}</Text>
                            )}
                        </View>
                    ))}
                </ScrollView>
            </View>

            <Modal visible={modal && isAdminEmpresa} transparent animationType='slide'>
                <Pressable
                    className='flex-1 bg-black/60 justify-end'
                    onPress={() => setModal(false)}
                >
                    <Pressable onPress={() => {}}>
                        <View className='bg-white dark:bg-zinc-900 rounded-t-2xl p-6 gap-4'>
                            <View className='flex-row items-center justify-between'>
                                <Text className='font-sans-bold text-xl text-zinc-900 dark:text-zinc-50'>Nuevo usuario</Text>
                                <TouchableOpacity onPress={() => setModal(false)}>
                                    <X size={20} color='#71717a' />
                                </TouchableOpacity>
                            </View>

                            {(['nombre', 'correo', 'password', 'sucursalId'] as (keyof FormState)[]).map(field => (
                                <View key={field} className='gap-1'>
                                    <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs capitalize'>
                                        {field === 'sucursalId' ? 'ID Sucursal (opcional)' : field}
                                    </Text>
                                    <TextInput
                                        className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans'
                                        value={form[field]}
                                        onChangeText={v => setForm(prev => ({ ...prev, [field]: v }))}
                                        secureTextEntry={field === 'password'}
                                        autoCapitalize='none'
                                        keyboardType={field === 'sucursalId' ? 'numeric' : 'default'}
                                        placeholderTextColor='#a1a1aa'
                                    />
                                </View>
                            ))}

                            <TouchableOpacity
                                className='bg-indigo-500 rounded-xl py-3.5 items-center mt-2'
                                onPress={handleCrear}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator color='#fff' />
                                ) : (
                                    <Text className='text-white font-sans-semibold text-base'>Crear usuario</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    )
}
