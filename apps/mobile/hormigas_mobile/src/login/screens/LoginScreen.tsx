import { useAuth } from '@/src/login/hooks/useAuth'
import { getRoleFromToken, homeRouteForRole } from '@/src/login/utils/session'
import { useSaleQueueStatus } from '@/src/pos/hooks/useSaleQueueStatus'
import { isNetworkError } from '@hormigas/application'
import { useState } from 'react'
import ButtonCustom from '@/src/utils/components/ButtonCustom'
import Form, { FormFieldConfig } from '@/src/utils/components/Form'
import { router } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '@hormigas/mobile-shared'
import { Text, View } from 'react-native'
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Package } from 'lucide-react-native'

const LOGIN_FIELDS: FormFieldConfig<LoginInput>[] = [
  {
    name: 'email',
    label: 'Email',
    placeholder: 'tu@email.com',
    autoCapitalize: 'none',
  },
  {
    name: 'password',
    label: 'Contraseña',
    placeholder: '********',
    secureTextEntry: true,
  }
]

export default function LoginScreen () {
  const { login } = useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Ventas del dispositivo sin enviar (de cualquier usuario): se envian al entrar quien las registro.
  const { pendingCount } = useSaleQueueStatus()
  const cardMaxWidth = useResponsiveValue<number | undefined>(undefined, 440, 440)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  })

  const handleLogin = async (data: LoginInput) => {
    setLoginError(null)
    setSubmitting(true)
    try {
      const token = await login(data)
      if (!token) throw new Error('El servidor no devolvió token')
      // Cada rol aterriza en su pantalla: USER -> POS, ADMIN -> panel, SUPER_ADMIN -> empresas.
      router.replace(homeRouteForRole(getRoleFromToken(token)))
    } catch (e) {
      const status = (e as { status?: number } | null)?.status
      if (isNetworkError(e)) setLoginError('Sin conexión con el servidor')
      else if (status === 401 || status === 403 || status === 400) setLoginError('Credenciales incorrectas')
      else setLoginError('No se pudo iniciar sesión. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      keyboardShouldPersistTaps='handled'
      enableOnAndroid
      extraScrollHeight={20}
      className='bg-stone-50 dark:bg-zinc-950'
    >
      <View
        style={{ width: '91.67%', maxWidth: cardMaxWidth }}
        className='self-center rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm'
      >
        <View className='flex flex-col gap-4'>
          <View className='items-center mb-2'>
            <View className='bg-indigo-500 p-4 rounded-2xl mb-4'>
              <Package size={36} color='white' />
            </View>
            <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Iniciar Sesión</Text>
            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm text-center mt-1'>
              Ingresa tus credenciales para acceder
            </Text>
          </View>

          {pendingCount > 0 ? (
            <View className='rounded-xl bg-amber-50 dark:bg-amber-500/15 p-3'>
              <Text className='font-sans text-sm text-center text-amber-800 dark:text-amber-300'>
                Hay {pendingCount} venta{pendingCount !== 1 ? 's' : ''} sin sincronizar en este dispositivo.
                Se enviarán al iniciar sesión con el usuario que las registró.
              </Text>
            </View>
          ) : null}

          <Form
            control={control}
            errors={errors}
            fields={LOGIN_FIELDS}
            scrollable={false}
          />

          {loginError ? (
            <Text className='font-sans text-sm text-center text-red-500'>{loginError}</Text>
          ) : null}

          <ButtonCustom
            title={submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            onPress={handleSubmit(handleLogin)}
            disabled={submitting}
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  )
}
