import InputField from "@/src/utils/components/InputFiled";
import { Text, TextInput } from "react-native";
import { View } from "react-native";
import { useForm, Controller } from 'react-hook-form'
import ButtonCustom from "@/src/utils/components/ButtonCustom";

interface BranchForm {
    nombre: string
    direccion: string
    responsable: string
}

export default function CreateBranch() {
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
        <View>
            <View>
                <Text>Nueva Sucursal</Text>
                <Text>Completa el formulario para crear una nueva sucursal</Text>
            </View>

            <View className="flex-1 p-4 gap-4">

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

      <ButtonCustom title="Guardar" onPress={handleSubmit(onSubmit)} />
    </View>
        </View>
    )
}