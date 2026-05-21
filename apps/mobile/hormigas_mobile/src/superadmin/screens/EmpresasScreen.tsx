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
import { validateNombre, validateNombreLugar, validateEmail, validatePassword, validateRFC, validateTelefono } from '@/src/utils/validation'

type EmpresaForm = { nombre: string; rfc: string; direccion: string; telefono: string }
type AdminForm = { nombre: string; correo: string; password: string }
type EmpresaErrors = Partial<Record<keyof EmpresaForm, string>>
type AdminErrors = Partial<Record<keyof AdminForm, string>>
const EMPTY_EMP: EmpresaForm = { nombre: '', rfc: '', direccion: '', telefono: '' }
const EMPTY_ADM: AdminForm = { nombre: '', correo: '', password: '' }

export default function EmpresasScreen() {
    const { logout } = useAuth()
    const { empresas, loading, error, saving, crear, toggleActivo } = useEmpresas()
    const [modal, setModal] = useState(false)
    const [empForm, setEmpForm] = useState<EmpresaForm>(EMPTY_EMP)
    const [admForm, setAdmForm] = useState<AdminForm>(EMPTY_ADM)
    const [empErrors, setEmpErrors] = useState<EmpresaErrors>({})
    const [admErrors, setAdmErrors] = useState<AdminErrors>({})

    const handleLogout = async () => {
        await logout()
        router.replace('/(login)')
    }

    const handleCrear = async () => {
        const eErrs: EmpresaErrors = {
            nombre: validateNombreLugar(empForm.nombre) ?? undefined,
            rfc: validateRFC(empForm.rfc) ?? undefined,
            direccion: empForm.direccion && empForm.direccion.length > 150 ? 'Máximo 150 caracteres' : undefined,
            telefono: validateTelefono(empForm.telefono) ?? undefined,
        }
        const aErrs: AdminErrors = {
            nombre: validateNombre(admForm.nombre) ?? undefined,
            correo: validateEmail(admForm.correo) ?? undefined,
            password: validatePassword(admForm.password) ?? undefined,
        }
        setEmpErrors(eErrs)
        setAdmErrors(aErrs)
        if (Object.values(eErrs).some(Boolean) || Object.values(aErrs).some(Boolean)) return
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
        <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
            <View className='bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 flex-row items-center justify-between'>
                <View>
                    <Text className='font-sans-medium text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest'>Super Admin</Text>
                    <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Empresas</Text>
                </View>
                <View className='flex-row items-center gap-3'>
                    <TouchableOpacity
                        className='flex-row items-center gap-1 bg-indigo-500 px-3 py-2 rounded-xl'
                        onPress={() => setModal(true)}
                    >
                        <Plus size={16} color='#fff' />
                        <Text className='text-white font-sans-semibold text-sm'>Nueva</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} className='p-2'>
                        <LogOut size={20} color='#71717a' />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && <ActivityIndicator className='mt-10' size='large' />}
            {error && <Text className='text-red-500 text-center mt-6 font-sans'>{error}</Text>}

            <ScrollView className='px-4 pt-4' showsVerticalScrollIndicator={false}>
                {empresas.map(e => (
                    <View
                        key={e.id}
                        className='bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-3 border border-stone-100 dark:border-zinc-800'
                    >
                        <View className='flex-row items-start justify-between'>
                            <View className='flex-row items-center gap-2 flex-1'>
                                <Building2 size={18} color='#6366f1' />
                                <View className='flex-1'>
                                    <Text className='font-sans-semibold text-base text-zinc-900 dark:text-zinc-50'>{e.nombre}</Text>
                                    <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs mt-0.5'>RFC: {e.rfc}</Text>
                                    {e.direccion && <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>{e.direccion}</Text>}
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => toggleActivo(e)}
                                className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 ${e.activo ? 'bg-green-100 dark:bg-green-900/30' : 'bg-stone-100 dark:bg-zinc-800'}`}
                            >
                                <Power size={12} color={e.activo ? '#059669' : '#9ca3af'} />
                                <Text className={`text-xs font-sans-medium ${e.activo ? 'text-green-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {e.activo ? 'Activa' : 'Inactiva'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {e.telefono && (
                            <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs mt-2'>Tel: {e.telefono}</Text>
                        )}
                    </View>
                ))}
                <View className='h-8' />
            </ScrollView>

            <Modal visible={modal} transparent animationType='slide'>
                <Pressable className='flex-1 bg-black/60 justify-end' onPress={() => { setModal(false); setEmpErrors({}); setAdmErrors({}) }}>
                    <Pressable onPress={() => {}}>
                        <ScrollView
                            className='bg-white dark:bg-zinc-900 rounded-t-2xl'
                            contentContainerStyle={{ padding: 24, gap: 16 }}
                            keyboardShouldPersistTaps='handled'
                        >
                            <View className='flex-row items-center justify-between'>
                                <Text className='font-sans-bold text-xl text-zinc-900 dark:text-zinc-50'>Nueva empresa</Text>
                                <TouchableOpacity onPress={() => { setModal(false); setEmpErrors({}); setAdmErrors({}) }}>
                                    <X size={20} color='#71717a' />
                                </TouchableOpacity>
                            </View>

                            <Text className='font-sans-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider'>Datos de la empresa</Text>
                            {(['nombre', 'rfc', 'direccion', 'telefono'] as (keyof EmpresaForm)[]).map(f => (
                                <View key={f} className='gap-1'>
                                    <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs capitalize'>{f}</Text>
                                    <TextInput
                                        className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans'
                                        value={empForm[f]}
                                        onChangeText={v => setEmpForm(p => ({ ...p, [f]: v }))}
                                        autoCapitalize={f === 'rfc' ? 'characters' : 'none'}
                                        placeholderTextColor='#a1a1aa'
                                    />
                                    {empErrors[f] && <Text className='text-red-500 text-xs mt-0.5'>{empErrors[f]}</Text>}
                                </View>
                            ))}

                            <Text className='font-sans-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-2'>Admin de la empresa</Text>
                            {(['nombre', 'correo', 'password'] as (keyof AdminForm)[]).map(f => (
                                <View key={f} className='gap-1'>
                                    <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs capitalize'>{f}</Text>
                                    <TextInput
                                        className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans'
                                        value={admForm[f]}
                                        onChangeText={v => setAdmForm(p => ({ ...p, [f]: v }))}
                                        secureTextEntry={f === 'password'}
                                        autoCapitalize='none'
                                        placeholderTextColor='#a1a1aa'
                                    />
                                    {admErrors[f] && <Text className='text-red-500 text-xs mt-0.5'>{admErrors[f]}</Text>}
                                </View>
                            ))}

                            <TouchableOpacity
                                className='bg-indigo-500 rounded-xl py-3.5 items-center mt-2 mb-4'
                                onPress={handleCrear}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color='#fff' />
                                ) : (
                                    <Text className='text-white font-sans-semibold text-base'>Crear empresa</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    )
}
