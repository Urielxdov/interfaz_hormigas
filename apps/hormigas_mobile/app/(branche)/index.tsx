import ButtonCustom from "@/src/utils/components/ButtonCustom";
import DataTable from "@/src/utils/components/DataTable";
import { statusClass } from "@/src/utils/helpers/ColorHerlper";
import useIsTablet from "@/src/utils/hooks/useIsTablet";
import { router } from "expo-router";
import { Building, Pencil, Trash } from "lucide-react-native";
import { Text, View } from "react-native";


const sucursales = [
    {
        nombre: 'Sucursal Centro',
        direccion: 'Av. Prncipal 123, Ciudad',
        responsable: 'Maria Garcia',
        estado: true,
        acciones: ''
    },
    {
        nombre: 'Sucursal Centro',
        direccion: 'Av. Prncipal 123, Ciudad',
        responsable: 'Maria Garcia',
        estado: false,
        acciones: ''
    }
]

export default function BranchDefaultScreen() {
    const isTable = useIsTablet()
    return(
        <View className="w-11/12 self-center gap-2">
            <View className={`flex ${isTable ? 'flex-row items-center justify-between' : 'flex-col gap-2'}`}>
                <View>
                    <Text className="font-bold text-2xl">Sucursales</Text>
                    <Text className="text-gray-400">Gestiona las suscursales de tu organizacion</Text>
                </View>
                <ButtonCustom
                    title="+ Nueva Sucursal"
                    onPress={() => router.push('/(branche)/newBranch')}
                />
            </View>
            <DataTable
                title="Sucursales"
                icon={Building}
                columns={[
                    {
                        key: 'nombre', label: 'Nombre'
                    },
                    {
                        key: 'direccion', label: 'Direccion'
                    },
                    {
                        key: 'responsable', label: 'Responsable'
                    },
                    {
                        key: 'estado', label: 'Estado', render: (val => (
                            <Text className={statusClass(val ? 'blue' : 'gray')}>
                                {val ? 'Activo' : 'Inactivo'}
                            </Text>
                        ))
                    },
                    {
                        key: 'acciones', label: 'Acciones', render: (val => (
                            <View className="flex flex-row gap-2">
                                <View >
                                    <Pencil size={30} color='black'/>
                                </View>
                                <View>
                                    <Trash size={30} color='red'/>
                                </View>
                            </View>
                        ))
                    }
                ]}
                data={sucursales}
            />
        </View>
    )
}