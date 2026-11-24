import { useAuth } from '@/src/login/hooks/useAuth'
import { getOwnerIdFromToken } from '@/src/login/utils/session'
import { useUsuarios } from '@/src/users/hooks/useUsuarios'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { useMemo, useState } from 'react'
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
import { Building2, Eye, EyeOff, Pencil, Power, Search, UserPlus, X } from 'lucide-react-native'
import { UsuarioResponseDTO } from '@hormigas/application'
import { passwordStrong, usuarioSchema } from '@hormigas/mobile-shared'
import { useBreakpoint, useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
import { useErrorModal } from '@/src/utils/hooks/useErrorModal'
import { useToast } from '@/src/utils/components/ToastProvider'
import RowAction from '@/src/utils/components/RowAction'

type FormState = { nombre: string; correo: string; password: string; sucursalId: number | null }
type FieldErrors = Partial<Record<keyof FormState, string>>

const EMPTY: FormState = { nombre: '', correo: '', password: '', sucursalId: null }

const ROLE_LABEL: Record<string, string> = { USER: 'Cajero', ADMIN: 'Administrador', SUPER_ADMIN: 'Superusuario' }

function rolPrincipal (u: UsuarioResponseDTO): string {
    const roles = u.roles ?? []
    if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN'
    if (roles.includes('ADMIN')) return 'ADMIN'
    return 'USER'
}

function formatoAcceso (iso?: string | null): string {
    if (!iso) return 'Nunca ha iniciado sesión'
    const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`)
    if (isNaN(d.getTime())) return 'Último acceso desconocido'
    return `Último acceso: ${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
}

function iniciales (nombre: string): string {
    return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || '?'
}

export default function UsuariosScreen() {
    const { usuarios, loading, error, creating, crear, actualizar, toggleActivo, recargar } = useUsuarios()
    const { branches } = useBranches()
    const { isAdminEmpresa, isSuperAdmin, token } = useAuth()
    const yo = token ? getOwnerIdFromToken(token) : null
    const isPhone = useBreakpoint() === 'phone'
    const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
    const paddingH = useResponsiveValue(16, 24, 32)
    const puedeGestionar = isAdminEmpresa || isSuperAdmin
    const toast = useToast()
    const { showError, errorModal } = useErrorModal()

    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<UsuarioResponseDTO | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY)
    const [errors, setErrors] = useState<FieldErrors>({})
    const [showPass, setShowPass] = useState(false)
    const [busqueda, setBusqueda] = useState('')
    const [toggling, setToggling] = useState<number | null>(null)

    const sucursalesActivas = branches.filter(b => b.activa)

    const lista = useMemo(() => {
        const q = busqueda.trim().toLowerCase()
        return usuarios
            .filter(u => !q || u.name.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q))
            .sort((a, b) => Number(b.activo) - Number(a.activo) || a.name.localeCompare(b.name, 'es'))
    }, [usuarios, busqueda])
    const activos = usuarios.filter(u => u.activo).length

    const abrir = (u: UsuarioResponseDTO | null) => {
        setEditing(u)
        setForm(u ? { nombre: u.name, correo: u.correo, password: '', sucursalId: u.sucursalId } : EMPTY)
        setErrors({})
        setShowPass(false)
        setModal(true)
    }

    const validar = (): FieldErrors => {
        const e: FieldErrors = {}
        if (editing) {
            const r = usuarioSchema.pick({ nombre: true, correo: true }).safeParse(form)
            if (!r.success) {
                const f = r.error.flatten().fieldErrors
                if (f.nombre) e.nombre = f.nombre[0]
                if (f.correo) e.correo = f.correo[0]
            }
            if (form.password) {
                const p = passwordStrong.safeParse(form.password)
                if (!p.success) e.password = p.error.issues[0]?.message
            }
        } else {
            const r = usuarioSchema.safeParse(form)
            if (!r.success) {
                const f = r.error.flatten().fieldErrors
                for (const k of ['nombre', 'correo', 'password'] as const) if (f[k]) e[k] = f[k]![0]
            }
        }
        // El admin crea cajeros y un cajero necesita sucursal para vender
        if (isAdminEmpresa && (!editing || rolPrincipal(editing) === 'USER') && !form.sucursalId) {
            e.sucursalId = 'Selecciona la sucursal donde trabajará'
        }
        return e
    }

    const handleGuardar = async () => {
        const e = validar()
        setErrors(e)
        if (Object.keys(e).length > 0) return
        try {
            if (editing) {
                await actualizar(editing.id, {
                    nombre: form.nombre.trim() !== editing.name ? form.nombre.trim() : undefined,
                    correo: form.correo.trim().toLowerCase() !== editing.correo ? form.correo.trim().toLowerCase() : undefined,
                    password: form.password || undefined,
                    sucursalId: form.sucursalId && form.sucursalId !== editing.sucursalId ? form.sucursalId : undefined,
                })
                toast.show({ type: 'success', title: 'Usuario actualizado', message: form.nombre.trim() })
            } else {
                await crear({
                    nombre: form.nombre.trim(),
                    correo: form.correo.trim().toLowerCase(),
                    password: form.password,
                    sucursalId: form.sucursalId,
                })
                toast.show({ type: 'success', title: 'Usuario creado', message: `${form.nombre.trim()} ya puede iniciar sesión.` })
            }
            setModal(false)
        } catch (err) {
            showError(err instanceof Error ? err.message : 'No se pudo guardar el usuario')
        }
    }

    const handleToggle = async (u: UsuarioResponseDTO) => {
        setToggling(u.id)
        try {
            const updated = await toggleActivo(u.id)
            toast.show({
                type: updated.activo ? 'success' : 'warning',
                title: updated.activo ? 'Usuario activado' : 'Usuario desactivado',
                message: updated.activo ? `${u.name} puede volver a iniciar sesión.` : `${u.name} ya no podrá iniciar sesión.`,
            })
        } catch (err) {
            showError(err instanceof Error ? err.message : 'No se pudo cambiar el estado')
        } finally {
            setToggling(null)
        }
    }

    const campo = (key: 'nombre' | 'correo' | 'password', label: string, placeholder: string) => (
        <View className='gap-1'>
            <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>
            <View className={`flex-row items-center border rounded-xl bg-white dark:bg-zinc-800 ${errors[key] ? 'border-red-400' : 'border-stone-200 dark:border-zinc-700'}`}>
                <TextInput
                    className='flex-1 px-3 py-3 text-zinc-900 dark:text-zinc-50 font-sans'
                    value={form[key]}
                    onChangeText={v => {
                        setForm(prev => ({ ...prev, [key]: v }))
                        if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
                    }}
                    placeholder={placeholder}
                    secureTextEntry={key === 'password' && !showPass}
                    autoCapitalize={key === 'nombre' ? 'words' : 'none'}
                    keyboardType={key === 'correo' ? 'email-address' : 'default'}
                    autoComplete='off'
                    placeholderTextColor='#a1a1aa'
                />
                {key === 'password' && (
                    <TouchableOpacity className='px-3' onPress={() => setShowPass(v => !v)} accessibilityLabel='Mostrar contraseña'>
                        {showPass ? <EyeOff size={18} color='#71717a' /> : <Eye size={18} color='#71717a' />}
                    </TouchableOpacity>
                )}
            </View>
            {errors[key] ? <Text className='text-red-500 text-xs font-sans'>{errors[key]}</Text> : null}
        </View>
    )

    return (
        <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
            <View style={{ maxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: paddingH }} className='flex-1 mt-4 gap-3'>
                <View className='flex-row items-center justify-between'>
                    <View className='flex-1'>
                        <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Usuarios</Text>
                        <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>
                            {activos} activo{activos === 1 ? '' : 's'}
                            {usuarios.length - activos > 0 ? ` · ${usuarios.length - activos} inactivo${usuarios.length - activos === 1 ? '' : 's'}` : ''}
                        </Text>
                    </View>
                    {puedeGestionar && (
                        <TouchableOpacity
                            className='flex-row items-center gap-1 bg-indigo-500 px-4 py-2.5 rounded-xl'
                            onPress={() => abrir(null)}
                        >
                            <UserPlus size={16} color='#fff' />
                            <Text className='text-white font-sans-semibold'>Nuevo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View className='flex-row items-center gap-2 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 bg-white dark:bg-zinc-900'>
                    <Search size={16} color='#a1a1aa' />
                    <TextInput
                        className='flex-1 py-2.5 font-sans text-zinc-900 dark:text-zinc-50'
                        placeholder='Buscar por nombre o correo'
                        placeholderTextColor='#a1a1aa'
                        value={busqueda}
                        onChangeText={setBusqueda}
                        autoCapitalize='none'
                    />
                </View>

                {error && <Text className='text-red-500 text-sm font-sans'>{error}</Text>}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={recargar} />}
                >
                    {lista.length === 0 && !loading && (
                        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-center mt-8'>
                            {busqueda ? 'Ningún usuario coincide con la búsqueda.' : 'Aún no hay usuarios.'}
                        </Text>
                    )}
                    <View style={isPhone ? { gap: 10 } : { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} className='pb-6'>
                        {lista.map(u => {
                            const rol = rolPrincipal(u)
                            const esYo = !!yo && u.correo.toLowerCase() === yo.toLowerCase()
                            return (
                                <View
                                    key={u.id}
                                    style={isPhone ? undefined : { width: '48.5%' }}
                                    className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 gap-3 ${u.activo ? '' : 'opacity-70'}`}
                                >
                                    <View className='flex-row items-center gap-3'>
                                        <View className={`w-10 h-10 rounded-full items-center justify-center ${u.activo ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                            <Text className={`font-sans-bold ${u.activo ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-500'}`}>{iniciales(u.name)}</Text>
                                        </View>
                                        <View className='flex-1'>
                                            <Text className='font-sans-semibold text-base text-zinc-900 dark:text-zinc-50' numberOfLines={1}>
                                                {u.name}{esYo ? ' (tú)' : ''}
                                            </Text>
                                            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm' numberOfLines={1}>{u.correo}</Text>
                                        </View>
                                        <View className={`rounded-full px-2 py-0.5 ${u.activo ? 'bg-green-100 dark:bg-green-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                            <Text className={`font-sans-semibold text-xs ${u.activo ? 'text-green-700 dark:text-green-400' : 'text-zinc-500'}`}>
                                                {u.activo ? 'Activo' : 'Inactivo'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className='flex-row flex-wrap gap-2'>
                                        <View className='rounded-md px-2 py-0.5 bg-stone-100 dark:bg-zinc-800'>
                                            <Text className='font-sans-medium text-xs text-zinc-600 dark:text-zinc-300'>{ROLE_LABEL[rol]}</Text>
                                        </View>
                                        {rol === 'USER' && (
                                            <View className={`flex-row items-center gap-1 rounded-md px-2 py-0.5 ${u.sucursalNombre ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-amber-50 dark:bg-amber-900/30'}`}>
                                                <Building2 size={11} color={u.sucursalNombre ? '#2563eb' : '#d97706'} />
                                                <Text className={`font-sans-medium text-xs ${u.sucursalNombre ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-400'}`}>
                                                    {u.sucursalNombre ?? 'Sin sucursal: no puede vender'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className='font-sans text-xs text-zinc-400 dark:text-zinc-500'>{formatoAcceso(u.ultimoAcceso)}</Text>

                                    {puedeGestionar && !esYo && (
                                        <View className='flex-row justify-end gap-2 pt-2 border-t border-stone-100 dark:border-zinc-800'>
                                            <RowAction label='Editar' icon={Pencil} onPress={() => abrir(u)} />
                                            <RowAction
                                                label={u.activo ? 'Desactivar' : 'Activar'}
                                                icon={Power}
                                                tone={u.activo ? 'danger' : 'success'}
                                                disabled={toggling === u.id}
                                                onPress={() => handleToggle(u)}
                                            />
                                        </View>
                                    )}
                                </View>
                            )
                        })}
                    </View>
                </ScrollView>
            </View>

            <Modal visible={modal && puedeGestionar} transparent animationType='slide' onRequestClose={() => setModal(false)}>
                <Pressable className='flex-1 bg-black/60 justify-end' onPress={() => setModal(false)}>
                    <Pressable onPress={() => {}}>
                        <ScrollView className='bg-white dark:bg-zinc-900 rounded-t-2xl' contentContainerStyle={{ padding: 24, gap: 14 }} keyboardShouldPersistTaps='handled'>
                            <View className='flex-row items-center justify-between'>
                                <View>
                                    <Text className='font-sans-bold text-xl text-zinc-900 dark:text-zinc-50'>
                                        {editing ? 'Editar usuario' : isSuperAdmin ? 'Nuevo administrador' : 'Nuevo cajero'}
                                    </Text>
                                    {!editing && isAdminEmpresa && (
                                        <Text className='font-sans text-xs text-zinc-500 dark:text-zinc-400'>Podrá vender en la sucursal que elijas.</Text>
                                    )}
                                </View>
                                <TouchableOpacity onPress={() => setModal(false)}>
                                    <X size={20} color='#71717a' />
                                </TouchableOpacity>
                            </View>

                            {campo('nombre', 'Nombre completo', 'Ej. Juan García')}
                            {campo('correo', 'Correo electrónico', 'juan@empresa.com')}
                            {campo('password', editing ? 'Nueva contraseña (opcional)' : 'Contraseña', 'Mínimo 8 caracteres')}

                            {isAdminEmpresa && (!editing || rolPrincipal(editing) === 'USER') && (
                                <View className='gap-1.5'>
                                    <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>Sucursal</Text>
                                    {sucursalesActivas.length === 0 ? (
                                        <Text className='font-sans text-sm text-amber-600'>No hay sucursales activas. Crea una primero.</Text>
                                    ) : (
                                        <View className='flex-row flex-wrap gap-2'>
                                            {sucursalesActivas.map(b => {
                                                const sel = form.sucursalId === Number(b.id)
                                                return (
                                                    <TouchableOpacity
                                                        key={String(b.id)}
                                                        onPress={() => {
                                                            setForm(prev => ({ ...prev, sucursalId: Number(b.id) }))
                                                            setErrors(prev => ({ ...prev, sucursalId: undefined }))
                                                        }}
                                                        className={`px-3 py-2 rounded-xl border ${sel ? 'bg-indigo-500 border-indigo-500' : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700'}`}
                                                    >
                                                        <Text className={`font-sans-medium text-sm ${sel ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>{b.nombre}</Text>
                                                    </TouchableOpacity>
                                                )
                                            })}
                                        </View>
                                    )}
                                    {errors.sucursalId ? <Text className='text-red-500 text-xs font-sans'>{errors.sucursalId}</Text> : null}
                                </View>
                            )}

                            <TouchableOpacity
                                className={`rounded-xl py-3.5 items-center mt-1 ${creating ? 'bg-indigo-300' : 'bg-indigo-500'}`}
                                onPress={handleGuardar}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator color='#fff' />
                                ) : (
                                    <Text className='text-white font-sans-semibold text-base'>{editing ? 'Guardar cambios' : 'Crear usuario'}</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
            {errorModal}
        </View>
    )
}
