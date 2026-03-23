import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Text, TextInput } from "react-native";
import { View } from "react-native";
import { useForm, Controller } from 'react-hook-form'
import ButtonCustom from "@/src/utils/components/ButtonCustom";
import { ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";

interface BranchForm {
    nombre: string
    direccion: string
    responsable: string
}

export default function Branchessss() {
    const { control, handleSubmit, formState: { errors } } = useForm<BranchForm>({
        defaultValues: {
            nombre: '',
            direccion: '',
            responsable: ''
        }
    })

    const onSubmit = () => {
        console.log("simon")
    }

    return (
        <View className="flex-1">
            {/* Header */}
            <View className="flex flex-row gap-2 items-center p-2">
                <ButtonCustom
                    onPress={() => router.back()}
                    icon={ArrowLeft}
                    iconColor="white"
                />
                <View className="flex-1">
                    <Text className="font-bold text-2xl">Nueva Sucursal</Text>
                    <Text className="text-gray-500">Completa el formulario para crear una nueva sucursal</Text>
                </View>
            </View>

            <KeyboardAwareScrollView
                className="flex-1 p-4"
                contentContainerStyle={{ gap: 16, paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={20}
            >
                {/* Nombre */}
                <View className="gap-1">
                    <Text className="font-bold">Nombre</Text>
                    <Controller
                        control={control}
                        name="nombre"
                        rules={{ required: 'El nombre es obligatorio' }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                className="border border-gray-200 rounded-xl p-3"
                                placeholder="Ej. Sucursal Centro"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                    {errors.nombre && <Text className="text-red-500">{errors.nombre.message}</Text>}
                </View>

                {/* Dirección */}
                <View className="gap-1">
                    <Text className="font-bold">Dirección</Text>
                    <Controller
                        control={control}
                        name="direccion"
                        rules={{ required: 'La dirección es obligatoria' }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                className="border border-gray-200 rounded-xl p-3"
                                placeholder="Ej. Av. Principal 123"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                    {errors.direccion && <Text className="text-red-500">{errors.direccion.message}</Text>}
                </View>

                {/* Responsable */}
                <View className="gap-1">
                    <Text className="font-bold">Responsable</Text>
                    <Controller
                        control={control}
                        name="responsable"
                        rules={{ required: 'El responsable es obligatorio' }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                className="border border-gray-200 rounded-xl p-3"
                                placeholder="Ej. María García"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                    {errors.responsable && <Text className="text-red-500">{errors.responsable.message}</Text>}
                </View>

                {/* Campo extra 1 */}
                <View className="gap-1">
                    <Text className="font-bold">Campo extra 1</Text>
                    <Controller
                        control={control}
                        name="responsable"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                className="border border-gray-200 rounded-xl p-3"
                                placeholder="Ej. Valor"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                </View>

                {/* Campo extra 2 */}
                <View className="gap-1">
                    <Text className="font-bold">Campo extra 2</Text>
                    <Controller
                        control={control}
                        name="responsable"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                className="border border-gray-200 rounded-xl p-3"
                                placeholder="Ej. Valor"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                </View>

                {/* Campo extra 3 */}
                <View className="gap-1">
                    <Text className="font-bold">Campo extra 3</Text>
                    <Controller
                        control={control}
                        name="responsable"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                className="border border-gray-200 rounded-xl p-3"
                                placeholder="Ej. Valor"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                </View>

                <ButtonCustom title="Guardar" onPress={handleSubmit(onSubmit)} />
            </KeyboardAwareScrollView>
        </View>
    )
}