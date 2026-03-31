import BranchSummaryScreen from '@/src/home/components/BranchSummaryScreen'
import CreateBranchScreen from '@/src/branches/screens/CreateBranch'
import ButtonCustom from '@/src/utils/components/ButtonCustom'
import DataTable from '@/src/utils/components/DataTable'
import Modal from '@/src/utils/components/Modal'
import { statusClass } from '@/src/utils/helpers/ColorHerlper'
import useIsTablet from '@/src/utils/hooks/useIsTablet'
import { Building, Pencil, Trash } from 'lucide-react-native'
import { useState } from 'react'
import { Text, View } from 'react-native'

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

export default function BranchesScreen () {
  const [modal, setModal] = useState(false)
  const isTablet = useIsTablet()

  return (
    <View>
      <View className='w-11/12 self-center gap-2'>
        <View
          className={`flex ${
            isTablet
              ? 'flex-row items-center justify-between'
              : 'flex-col gap-2'
          }`}
        >
          <View>
            <Text className='text-2xl font-bold'>Sucursales</Text>
            <Text className='text-gray-400'>
              Gestiona las suscursales de tu organizacion
            </Text>
          </View>
          <ButtonCustom
            title='+ Nueva Sucursal'
            onPress={() => setModal(true)}
          />
        </View>

        <DataTable
          title='Sucursales'
          icon={Building}
          columns={[
            {
              key: 'nombre',
              label: 'Nombre'
            },
            {
              key: 'direccion',
              label: 'Direccion'
            },
            {
              key: 'responsable',
              label: 'Responsable'
            },
            {
              key: 'estado',
              label: 'Estado',
              render: val => (
                <Text className={statusClass(val ? 'blue' : 'gray')}>
                  {val ? 'Activo' : 'Inactivo'}
                </Text>
              )
            },
            {
              key: 'acciones',
              label: 'Acciones',
              render: () => (
                <View className='flex flex-row gap-2'>
                  <View>
                    <Pencil size={30} color='black' />
                  </View>
                  <View>
                    <Trash size={30} color='red' />
                  </View>
                </View>
              )
            }
          ]}
          data={sucursales}
        />

        <BranchSummaryScreen />
      </View>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
      >
        <CreateBranchScreen />
      </Modal>
    </View>
  )
}
