import { useEmpresas } from '@/src/superadmin/hooks/useEmpresas'
import { useAuth } from '@/src/login/hooks/useAuth'
import { router } from 'expo-router'
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
import { Building2, LogOut, Plus, Power, X } from 'lucide-react-native'
import { empresaSchema } from '@hormigas/mobile-shared'
import { useErrorModal } from '@/src/utils/hooks/useErrorModal'
import { useToast } from '@/src/utils/components/ToastProvider'
import { EmpresaResponseDTO } from '@hormigas/application'
import { KeyboardTypeOptions } from 'react-native'

const EMP_FIELDS: { key: keyof EmpresaForm; label: string; placeholder: string; keyboard?: KeyboardTypeOptions; caps?: 'characters' | 'words' | 'sentences'; max?: number }[] = [
    { key: 'nombre', label: 'Nombre comercial', placeholder: 'Ej. Abarrotes La Hormiga', caps: 'words', max: 120 },
    { key: 'rfc', label: 'RFC', placeholder: 'ABC010101AB1', caps: 'characters', max: 13 },
    { key: 'direccion', label: 'Dirección', placeholder: 'Calle, número, colonia, ciudad', caps: 'sentences', max: 250 },
    { key: 'telefono', label: 'Teléfono (10 dígitos)', placeholder: '5512345678', keyboard: 'phone-pad', max: 10 },
]
const ADM_FIELDS: { key: keyof AdminForm; label: string; placeholder: string; keyboard?: KeyboardTypeOptions; secure?: boolean; caps?: 'words' }[] = [
    { key: 'nombre', label: 'Nombre del administrador', placeholder: 'Ej. María López', caps: 'words' },
    { key: 'correo', label: 'Correo (será su usuario)', placeholder: 'admin@empresa.com', keyboard: 'email-address' },
    { key: 'password', label: 'Contraseña', placeholder: 'Mínimo 8 caracteres', secure: true },
]

type EmpresaForm = { nombre: string; rfc: string; direccion: string; telefono: string }
type AdminForm = { nombre: string; correo: string; password: string }
type EmpresaErrors = Partial<Record<keyof EmpresaForm, string>>
type AdminErrors = Partial<Record<keyof AdminForm, string>>
const EMPTY_EMP: EmpresaForm = { nombre: '', rfc: '', direccion: '', telefono: '' }
const EMPTY_ADM: AdminForm = { nombre: '', correo: '', password: '' }

export default function EmpresasScreen() {
    const { logout } = useAuth()
    const { empresas, loading, error, saving, crear, toggleActivo, recargar } = useEmpresas()
    const toast = useToast()
    const [confirmar, setConfirmar] = useState<EmpresaResponseDTO | null>(null)
    const [toggling, setToggling] = useState<number | null>(null)
    const activas = empresas.filter(e => e.activo).length

    const cambiarEstado = async (e: EmpresaResponseDTO) => {
        setConfirmar(null)
        setToggling(e.id)
        try {
            await toggleActivo(e)
            toast.show({
                type: e.activo ? 'warning' : 'success',
                title: e.activo ? 'Empresa desactivada' : 'Empresa reactivada',
                message: e.activo ? `Los usuarios de ${e.nombre} ya no pueden iniciar sesión.` : `${e.nombre} vuelve a operar.`,
            })
        } catch (err) {
            showError(err instanceof Error ? err.message : 'No se pudo cambiar el estado')
        } finally {
            setToggling(null)
        }
    }
    const [modal, setModal] = useState(false)
    const [empForm, setEmpForm] = useState<EmpresaForm>(EMPTY_EMP)
    const [admForm, setAdmForm] = useState<AdminForm>(EMPTY_ADM)
    const [empErrors, setEmpErrors] = useState<EmpresaErrors>({})
    const [admErrors, setAdmErrors] = useState<AdminErrors>({})
    const { showError, errorModal } = useErrorModal()

    const handleLogout = async () => {
        await logout()
        router.replace('/(login)/login')
    }

    const handleCrear = async () => {
        const result = empresaSchema.safeParse({ empresa: empForm, admin: admForm })
        if (!result.success) {
            const eErrs: EmpresaErrors = {}
            const aErrs: AdminErrors = {}
            for (const issue of result.error.issues) {
                const [section, field] = issue.path
                if (section === 'empresa') eErrs[field as keyof EmpresaForm] = issue.message
                if (section === 'admin') aErrs[field as keyof AdminForm] = issue.message
            }
            setEmpErrors(eErrs)
            setAdmErrors(aErrs)
            return
        }
        setEmpErrors({})
        setAdmErrors({})
        try {
            await crear({ empresa: result.data.empresa, admin: result.data.admin })
            toast.show({ type: 'success', title: 'Empresa creada', message: `${result.data.empresa.nombre}: su admin ya puede iniciar sesión.` })
            setEmpForm(EMPTY_EMP)
            setAdmForm(EMPTY_ADM)
            setModal(false)
        } catch (e) {
            showError(e instanceof Error ? e.message : 'No se pudo crear la empresa')
        }
    }

    return (
        <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
            <View className='bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 flex-row items-center justify-between'>
                <View>
                    <Text className='font-sans-medium text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest'>Super Admin</Text>
                    <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Empresas</Text>
                    <Text className='font-sans text-xs text-zinc-500 dark:text-zinc-400'>
                        {activas} activa{activas === 1 ? '' : 's'}{empresas.length - activas > 0 ? ` · ${empresas.length - activas} inactiva${empresas.length - activas === 1 ? '' : 's'}` : ''}
                    </Text>
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

            {error && <Text className='text-red-500 text-center mt-6 font-sans'>{error}</Text>}

            <ScrollView
                className='px-4 pt-4'
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={recargar} />}
            >
                {!loading && empresas.length === 0 && !error && (
                    <View className='items-center mt-10 gap-2'>
                        <Building2 size={32} color='#a1a1aa' />
                        <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-center'>Aún no hay empresas. Crea la primera con "Nueva".</Text>
                    </View>
                )}
                {empresas.map(e => (
                    <View
                        key={e.id}
                        className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-3 border border-stone-100 dark:border-zinc-800 ${e.activo ? '' : 'opacity-70'}`}
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
                                onPress={() => (e.activo ? setConfirmar(e) : cambiarEstado(e))}
                                disabled={toggling === e.id}
                                accessibilityLabel={e.activo ? `Desactivar ${e.nombre}` : `Activar ${e.nombre}`}
                                className={`px-2.5 py-1.5 rounded-full flex-row items-center gap-1 ${e.activo ? 'bg-green-100 dark:bg-green-900/30' : 'bg-stone-100 dark:bg-zinc-800'}`}
                            >
                                {toggling === e.id
                                    ? <ActivityIndicator size='small' color='#6366f1' />
                                    : <Power size={12} color={e.activo ? '#059669' : '#9ca3af'} />}
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
                            {EMP_FIELDS.map(f => (
                                <View key={f.key} className='gap-1'>
                                    <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{f.label}</Text>
                                    <TextInput
                                        className={`border rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans ${empErrors[f.key] ? 'border-red-400' : 'border-stone-200 dark:border-zinc-700'}`}
                                        value={empForm[f.key]}
                                        onChangeText={v => {
                                            setEmpForm(p => ({ ...p, [f.key]: f.key === 'telefono' ? v.replace(/\D/g, '') : v }))
                                            if (empErrors[f.key]) setEmpErrors(p => ({ ...p, [f.key]: undefined }))
                                        }}
                                        placeholder={f.placeholder}
                                        keyboardType={f.keyboard ?? 'default'}
                                        autoCapitalize={f.caps ?? 'none'}
                                        maxLength={f.max}
                                        placeholderTextColor='#a1a1aa'
                                    />
                                    {empErrors[f.key] && <Text className='text-red-500 text-xs mt-0.5'>{empErrors[f.key]}</Text>}
                                </View>
                            ))}

                            <Text className='font-sans-semibold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-2'>Admin de la empresa</Text>
                            {ADM_FIELDS.map(f => (
                                <View key={f.key} className='gap-1'>
                                    <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{f.label}</Text>
                                    <TextInput
                                        className={`border rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans ${admErrors[f.key] ? 'border-red-400' : 'border-stone-200 dark:border-zinc-700'}`}
                                        value={admForm[f.key]}
                                        onChangeText={v => {
                                            setAdmForm(p => ({ ...p, [f.key]: v }))
                                            if (admErrors[f.key]) setAdmErrors(p => ({ ...p, [f.key]: undefined }))
                                        }}
                                        placeholder={f.placeholder}
                                        secureTextEntry={!!f.secure}
                                        keyboardType={f.keyboard ?? 'default'}
                                        autoCapitalize={f.caps ?? 'none'}
                                        autoComplete='off'
                                        placeholderTextColor='#a1a1aa'
                                    />
                                    {admErrors[f.key] && <Text className='text-red-500 text-xs mt-0.5'>{admErrors[f.key]}</Text>}
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
            <Modal visible={!!confirmar} transparent animationType='fade' onRequestClose={() => setConfirmar(null)}>
                <View className='flex-1 bg-black/60 justify-center px-6'>
                    <View className='bg-white dark:bg-zinc-900 rounded-2xl p-5 gap-3'>
                        <Text className='font-sans-bold text-lg text-zinc-900 dark:text-zinc-50'>¿Desactivar {confirmar?.nombre}?</Text>
                        <Text className='font-sans text-sm text-zinc-600 dark:text-zinc-400'>
                            Todos sus usuarios (administrador y cajeros) dejarán de poder iniciar sesión hasta que la reactives.
                        </Text>
                        <View className='flex-row justify-end gap-2 mt-2'>
                            <TouchableOpacity className='px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-800' onPress={() => setConfirmar(null)}>
                                <Text className='font-sans-semibold text-zinc-700 dark:text-zinc-200'>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className='px-4 py-2.5 rounded-xl bg-red-600' onPress={() => confirmar && cambiarEstado(confirmar)}>
                                <Text className='font-sans-semibold text-white'>Desactivar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {errorModal}
        </View>
    )
}
