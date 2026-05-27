import { useAuth, isSuperAdminToken } from '@/src/login/hooks/useAuth'
import { TokenServiceImpl } from '@hormigas/infrastructure'
import { storage } from '@/src/adapters/AsyncStorageAdapter'

const tokenService = new TokenServiceImpl(storage)
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
    try {
      await login(data)
      const token = await tokenService.getToken()
      const superAdmin = token ? isSuperAdminToken(token) : false
      router.replace(superAdmin ? '/(superadmin)' : '/(tabs)/home')
    } catch (error) {
      console.error('[LoginScreen] Error:', error)
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

          <Form
            control={control}
            errors={errors}
            fields={LOGIN_FIELDS}
            scrollable={false}
          />

          <ButtonCustom
            title='Iniciar sesión'
            onPress={handleSubmit(handleLogin)}
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  )
}
