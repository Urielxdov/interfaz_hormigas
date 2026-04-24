import BranchSummaryScreen from '@/src/home/components/BranchSummaryScreen'
import CreateBranchScreen from '@/src/branches/screens/CreateBranch'
import ButtonCustom from '@/src/utils/components/ButtonCustom'
import DataTable from '@/src/utils/components/DataTable'
import Modal from '@/src/utils/components/Modal'
import { statusClass } from '@/src/utils/helpers/ColorHerlper'
import useIsTablet from '@/src/utils/hooks/useIsTablet'
import { Building, Pencil, Power } from 'lucide-react-native'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { BranchItemTableDTO } from '@/interfaces/Branch'
import { BranchMapper } from '@/mappers/BranchMapper'

export default function BranchesScreen () {
  const [modal, setModal] = useState(false)
  const isTablet = useIsTablet()

  const [selectBranch, setSelectedBranch] = useState<BranchItemTableDTO | null>(null)

  const { branches, toggleStatus, updateBranch, createBranch } = useBranches()

  const mappedBranches: BranchItemTableDTO[] = branches.map(branch =>
    BranchMapper.toListTable(branch)
  )

  const handleClose = () => {
    setModal(false)
    setSelectedBranch(null)
  }

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
            { key: 'nombre', label: 'Nombre' },
            { key: 'direccion', label: 'Direccion' },
            { key: 'responsable', label: 'Responsable' },
            {
              key: 'activa',
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
              render: (_, row) => (
                <View className='flex flex-row gap-2'>
                  <ButtonCustom
                    onPress={() => {
                      setSelectedBranch(row)
                      setModal(true)
                    }}
                    bgColor='bg-blue-500'
                    icon={Pencil}
                    iconSize={18}
                    compact
                  />
                  <ButtonCustom
                    onPress={() => toggleStatus(row.id)}
                    bgColor={`${row.activa ? 'bg-green-500' : 'bg-red-500'}`}
                    icon={Power}
                    iconSize={18}
                    compact
                  />
                </View>
              )
            }
          ]}
          data={mappedBranches}
        />

        <BranchSummaryScreen />
      </View>

      <Modal isOpen={modal} onClose={handleClose}>
        <CreateBranchScreen
          defaultValues={selectBranch ? {
            nombre: selectBranch.nombre,
            direccion: selectBranch.direccion ?? '',
            responsable: selectBranch.responsable ?? '',
          } : undefined}
          onSubmit={async (data) => {
            if (selectBranch) {
              await updateBranch({
                localId: selectBranch.id,
                serverId: selectBranch.serverId,
                nombre: data.nombre,
                direccion: data.direccion,
                responsable: data.responsable,
                codigo: data.codigo,
                telefono: data.telefono,
                ciudad: data.ciudad,
                activa: selectBranch.activa,
              })
            } else {
              await createBranch(data)
            }
            handleClose()
          }}
        />
      </Modal>
    </View>
  )
}
