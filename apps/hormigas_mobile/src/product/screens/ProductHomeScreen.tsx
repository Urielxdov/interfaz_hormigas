// src/product/screens/ProductHomeScreen.tsx
import { View, Text, TextInput } from 'react-native'
import { useRef } from 'react'
import InputField from '@/src/utils/components/InputFiled'
import ButtonCustom from '@/src/utils/components/ButtonCustom'
import useLogin from '../hooks/useLogin'

export default function ProductHomeScreen () {
  const passwordRef = useRef<TextInput>(null)
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleLogin
  } = useLogin()

  return (
    <View className='flex-1 justify-center items-center gap-4 p-4 bg-gray-100'>
      <View className='flex gap-2 w-full'>
        <Text className='text-4xl font-bold'>Iniciar Sesión</Text>
        <Text className='text-xl text-gray-600'>
          Ingresa tu email y contraseña de usuario
        </Text>
      </View>

      <InputField
        label='Email'
        placeholder='tu@email.com'
        value={email}
        onChangeText={setEmail}
        returnKeyType='next'
        onSubmitEditingProp={() => passwordRef.current?.focus()}
      />
      <InputField
        label='Contraseña'
        placeholder='••••••••'
        secureText={true}
        value={password}
        onChangeText={setPassword}
        returnKeyType='done'
        onSubmitEditingProp={handleLogin}
        blurOnSubmitProp={true}
        inputRef={passwordRef}
      />

      {error && <Text className='text-red-500'>{error}</Text>}

      <ButtonCustom
        title={loading ? 'Cargando...' : 'Iniciar sesión'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  )
}
