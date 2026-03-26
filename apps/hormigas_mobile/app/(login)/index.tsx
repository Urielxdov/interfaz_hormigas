import ButtonCustom from "@/src/utils/components/ButtonCustom";
import InputField from "@/src/utils/components/InputFiled";
import { useAuth } from "@/src/login/hooks/useAuth";
import { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";

export default function LoginDefaultScreen() {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const { login } = useAuth()

    const passwordRef = useRef<TextInput>(null)

    const handleLogin = () => {
        console.log({ email, password })
        console.log(login({email, password}))
        // tu lógica de login aquí
        //router.replace('/(branche)')
    }

    return (
        <View className="flex flex-col gap-3 w-11/12 self-center border border-gray-200 p-3 rounded-xl bg-white">
            <View className="flex flex-col gap-2">
                <Text className="font-bold text-2xl">Iniciar Sesión</Text>
                <Text className="text-gray-500">Ingresa tu email y contraseña para acceder a tu cuenta</Text>
            </View>
            <View>
                <InputField
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail} 
                returnKeyType="next"
                onSubmitEditingProp={() => passwordRef.current?.focus()}
                blurOnSubmitProp={false}
            />
            <InputField
                label="Contraseña"
                placeholder="••••••••"
                secureText={true}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditingProp={handleLogin}
                blurOnSubmitProp={true}
                inputRef={passwordRef}
            />
            </View>
            <ButtonCustom
                title="Iniciar sesión"
                onPress={handleLogin}
                bgColor="bg-black"
            />
        </View>
    )
}