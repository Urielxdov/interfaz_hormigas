import { useUsuarios } from '@/src/users/hooks/useUsuarios'
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
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="w-11/12 self-center mt-4 gap-2">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-2xl font-bold">Usuarios</Text>
                        <Text className="text-gray-500 text-sm">{usuarios.length} en esta empresa</Text>
                    </View>
                    <TouchableOpacity
                        className="flex-row items-center gap-1 bg-black px-4 py-2 rounded-lg"
                        onPress={() => setModal(true)}
                    >
                        <UserPlus size={16} color="#fff" />
                        <Text className="text-white font-semibold">Nuevo</Text>
                    </TouchableOpacity>
                </View>

                {loading && <ActivityIndicator className="mt-4" />}
                {error && <Text className="text-red-500 text-sm mt-2">{error}</Text>}

                <ScrollView className="mt-2" showsVerticalScrollIndicator={false}>
                    {usuarios.map(u => (
                        <View
                            key={u.id}
                            className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-2">
                                    <Users size={18} color="#374151" />
                                    <Text className="font-semibold text-base text-gray-800">{u.name}</Text>
                                </View>
                                <View
                                    className={`px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-100' : 'bg-gray-100'}`}
                                >
                                    <Text className={`text-xs font-medium ${u.activo ? 'text-green-700' : 'text-gray-500'}`}>
                                        {u.activo ? 'Activo' : 'Inactivo'}
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-gray-500 text-sm mt-1">{u.correo}</Text>
                            {u.sucursalId && (
                                <Text className="text-gray-400 text-xs mt-1">Sucursal ID: {u.sucursalId}</Text>
                            )}
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Modal crear usuario */}
            <Modal visible={modal} transparent animationType="slide">
                <Pressable
                    className="flex-1 bg-black/40 justify-end"
                    onPress={() => setModal(false)}
                >
                    <Pressable onPress={() => {}}>
                        <View className="bg-white rounded-t-2xl p-6 gap-4">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-xl font-bold">Nuevo usuario</Text>
                                <TouchableOpacity onPress={() => setModal(false)}>
                                    <X size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            {(['nombre', 'correo', 'password', 'sucursalId'] as (keyof FormState)[]).map(field => (
                                <View key={field} className="gap-1">
                                    <Text className="text-sm font-medium text-gray-700 capitalize">
                                        {field === 'sucursalId' ? 'ID Sucursal (opcional)' : field}
                                    </Text>
                                    <TextInput
                                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900"
                                        value={form[field]}
                                        onChangeText={v => setForm(prev => ({ ...prev, [field]: v }))}
                                        secureTextEntry={field === 'password'}
                                        autoCapitalize="none"
                                        keyboardType={field === 'sucursalId' ? 'numeric' : 'default'}
                                    />
                                </View>
                            ))}

                            <TouchableOpacity
                                className="bg-black rounded-lg py-3.5 items-center mt-2"
                                onPress={handleCrear}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-semibold text-base">Crear usuario</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    )
}
