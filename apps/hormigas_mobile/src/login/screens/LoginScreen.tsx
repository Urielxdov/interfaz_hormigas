import { useAuth } from '@/src/login/hooks/useAuth'
import ButtonCustom from '@/src/utils/components/ButtonCustom'
import Form, { FormFieldConfig } from '@/src/utils/components/Form'
import { router } from 'expo-router'
import { useForm } from 'react-hook-form'
import { Text, View } from 'react-native'

type LoginFormValues = {
  email: string
  password: string
}

const LOGIN_FIELDS: FormFieldConfig<LoginFormValues>[] = [
  {
    name: 'email',
    label: 'Email',
    placeholder: 'tu@email.com',
    autoCapitalize: 'none',
    rules: { required: 'El email es obligatorio' }
  },
  {
    name: 'password',
    label: 'Contrasena',
    placeholder: '********',
    secureTextEntry: true,
    rules: { required: 'La contrasena es obligatoria' }
  }
]

export default function LoginScreen () {
  const { login } = useAuth()
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const handleLogin = (data: LoginFormValues) => {
    console.log(data)
    console.log(login(data))
    router.replace('/(branche)')
  }

  return (
    <View className='w-11/12 self-center rounded-xl border border-gray-200 bg-white p-3'>
      <View className='flex flex-col gap-3'>
        <View className='flex flex-col gap-2'>
          <Text className='text-2xl font-bold'>Iniciar Sesion</Text>
          <Text className='text-gray-500'>
            Ingresa tu email y contrasena para acceder a tu cuenta
          </Text>
        </View>

        <Form control={control} errors={errors} fields={LOGIN_FIELDS} />

        <ButtonCustom
          title='Iniciar sesion'
          onPress={handleSubmit(handleLogin)}
          bgColor='bg-black'
        />
      </View>
    </View>
  )
}
