import { useAuth } from '@/context/AuthContext'
import { useLogin } from '@/hooks/useLogin'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'

type LoginForm = { email: string; password: string }

export default function LoginScreen() {
  const { login, isLoading, error } = useLogin()
  const { setToken } = useAuth()
  const router = useRouter()

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' }
  })

  const onSubmit = async (data: LoginForm) => {
    const token = await login(data.email, data.password)
    if (token) {
      setToken(token)
      router.replace('/branch-select')
    }
  }

  return (
    <View className='flex-1 bg-gray-50 justify-center px-6'>
      <View className='bg-white rounded-2xl p-6 gap-5 shadow-sm'>
        <View className='gap-1'>
          <Text className='text-3xl font-bold text-gray-900'>Hormigas POS</Text>
          <Text className='text-gray-500'>Ingresa tus credenciales para continuar</Text>
        </View>

        <View className='gap-4'>
          <View className='gap-1'>
            <Text className='text-sm font-medium text-gray-700'>Email</Text>
            <Controller
              control={control}
              name='email'
              rules={{ required: 'El email es obligatorio' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className='border border-gray-300 rounded-lg px-4 py-3 text-base'
                  placeholder='tu@email.com'
                  autoCapitalize='none'
                  keyboardType='email-address'
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.email && <Text className='text-red-500 text-xs'>{errors.email.message}</Text>}
          </View>

          <View className='gap-1'>
            <Text className='text-sm font-medium text-gray-700'>Contraseña</Text>
            <Controller
              control={control}
              name='password'
              rules={{ required: 'La contraseña es obligatoria' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className='border border-gray-300 rounded-lg px-4 py-3 text-base'
                  placeholder='••••••••'
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.password && <Text className='text-red-500 text-xs'>{errors.password.message}</Text>}
          </View>
        </View>

        {error && (
          <View className='bg-red-50 border border-red-200 rounded-lg px-4 py-3'>
            <Text className='text-red-600 text-sm'>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          className='bg-black rounded-lg py-4 items-center'
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color='white' />
            : <Text className='text-white font-semibold text-base'>Iniciar sesión</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}
