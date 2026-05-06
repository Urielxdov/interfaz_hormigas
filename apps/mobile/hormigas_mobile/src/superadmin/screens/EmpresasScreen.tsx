import { useEmpresas } from '@/src/superadmin/hooks/useEmpresas'
import { useAuth } from '@/src/login/hooks/useAuth'
import { router } from 'expo-router'
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
import { Building2, LogOut, Plus, Power, X } from 'lucide-react-native'

type EmpresaForm = { nombre: string; rfc: string; direccion: string; telefono: string }
type AdminForm = { nombre: string; correo: string; password: string }
const EMPTY_EMP: EmpresaForm = { nombre: '', rfc: '', direccion: '', telefono: '' }
const EMPTY_ADM: AdminForm = { nombre: '', correo: '', password: '' }

export default function EmpresasScreen() {
    const { logout } = useAuth()
    const { empresas, loading, error, saving, crear, toggleActivo } = useEmpresas()
    const [modal, setModal] = useState(false)
    const [empForm, setEmpForm] = useState<EmpresaForm>(EMPTY_EMP)
    const [admForm, setAdmForm] = useState<AdminForm>(EMPTY_ADM)

    const handleLogout = async () => {
        await logout()
        router.replace('/(login)')
    }

    const handleCrear = async () => {
        if (!empForm.nombre || !empForm.rfc || !admForm.nombre || !admForm.correo || !admForm.password) {
            Alert.alert('Error', 'Todos los campos son obligatorios')
            return
        }
        try {
            await crear({ empresa: empForm, admin: admForm })
            setEmpForm(EMPTY_EMP)
            setAdmForm(EMPTY_ADM)
            setModal(false)
        } catch {
            Alert.alert('Error', 'No se pudo crear la empresa')
        }
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200 px-5 pt-14 pb-4 flex-row items-center justify-between">
                <View>
                    <Text className="text-xs text-gray-400 font-medium uppercase tracking-widest">Super Admin</Text>
                    <Text className="text-2xl font-bold text-gray-900">Empresas</Text>
                </View>
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        className="flex-row items-center gap-1 bg-black px-3 py-2 rounded-lg"
                        onPress={() => setModal(true)}
                    >
                        <Plus size={16} color="#fff" />
                        <Text className="text-white font-semibold text-sm">Nueva</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} className="p-2">
                        <LogOut size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && <ActivityIndicator className="mt-10" size="large" />}
            {error && <Text className="text-red-500 text-center mt-6">{error}</Text>}

            <ScrollView className="px-4 pt-4" showsVerticalScrollIndicator={false}>
                {empresas.map(e => (
                    <View
                        key={e.id}
                        className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
                    >
                        <View className="flex-row items-start justify-between">
                            <View className="flex-row items-center gap-2 flex-1">
                                <Building2 size={18} color="#374151" />
                                <View className="flex-1">
                                    <Text className="font-semibold text-base text-gray-900">{e.nombre}</Text>
                                    <Text className="text-gray-400 text-xs mt-0.5">RFC: {e.rfc}</Text>
                                    {e.direccion && <Text className="text-gray-400 text-xs">{e.direccion}</Text>}
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => toggleActivo(e)}
                                className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 ${e.activo ? 'bg-green-100' : 'bg-gray-100'}`}
                            >
                                <Power size={12} color={e.activo ? '#059669' : '#9ca3af'} />
                                <Text className={`text-xs font-medium ${e.activo ? 'text-green-700' : 'text-gray-500'}`}>
                                    {e.activo ? 'Activa' : 'Inactiva'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {e.telefono && (
                            <Text className="text-gray-400 text-xs mt-2">Tel: {e.telefono}</Text>
                        )}
                    </View>
                ))}
                <View className="h-8" />
            </ScrollView>

            {/* Modal crear empresa */}
            <Modal visible={modal} transparent animationType="slide">
                <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setModal(false)}>
                    <Pressable onPress={() => {}}>
                        <ScrollView
                            className="bg-white rounded-t-2xl"
                            contentContainerStyle={{ padding: 24, gap: 16 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View className="flex-row items-center justify-between">
                                <Text className="text-xl font-bold">Nueva empresa</Text>
                                <TouchableOpacity onPress={() => setModal(false)}>
                                    <X size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Datos de la empresa</Text>
                            {(['nombre', 'rfc', 'direccion', 'telefono'] as (keyof EmpresaForm)[]).map(f => (
                                <View key={f} className="gap-1">
                                    <Text className="text-sm font-medium text-gray-700 capitalize">{f}</Text>
                                    <TextInput
                                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900"
                                        value={empForm[f]}
                                        onChangeText={v => setEmpForm(p => ({ ...p, [f]: v }))}
                                        autoCapitalize={f === 'rfc' ? 'characters' : 'none'}
                                    />
                                </View>
                            ))}

                            <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-2">Admin de la empresa</Text>
                            {(['nombre', 'correo', 'password'] as (keyof AdminForm)[]).map(f => (
                                <View key={f} className="gap-1">
                                    <Text className="text-sm font-medium text-gray-700 capitalize">{f}</Text>
                                    <TextInput
                                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900"
                                        value={admForm[f]}
                                        onChangeText={v => setAdmForm(p => ({ ...p, [f]: v }))}
                                        secureTextEntry={f === 'password'}
                                        autoCapitalize="none"
                                    />
                                </View>
                            ))}

                            <TouchableOpacity
                                className="bg-black rounded-lg py-3.5 items-center mt-2 mb-4"
                                onPress={handleCrear}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-semibold text-base">Crear empresa</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    )
}
