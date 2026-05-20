import BranchSummaryScreen from '@/src/home/components/BranchSummaryScreen'
import CreateBranchScreen from '@/src/branches/screens/CreateBranch'
import ButtonCustom from '@/src/utils/components/ButtonCustom'
import DataTable from '@/src/utils/components/DataTable'
import Modal from '@/src/utils/components/Modal'
import { statusClass } from '@/src/utils/helpers/ColorHerlper'
import useIsTablet from '@/src/utils/hooks/useIsTablet'
import { Building, Pencil, Power } from 'lucide-react-native'
import { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { BranchItemTableDTO } from '@/interfaces/Branch'
import { BranchMapper } from '@/mappers/BranchMapper'
import { router } from 'expo-router'

export default function BranchesScreen () {
  const [modal, setModal] = useState(false)
  const isTablet = useIsTablet()

  const [selectBranch, setSelectedBranch] = useState<BranchItemTableDTO | null>(null)

  const { branches, toggleStatus, updateBranch, createBranch } = useBranches()

  const mappedBranches: BranchItemTableDTO[] = branches.map(branch =>
    BranchMapper.toListTable(branch)
  )

  const closeModal = () => {
    setModal(false)
    setSelectedBranch(null)
  }

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      <View className='w-11/12 self-center gap-2 pt-4'>
        <View
          className={`flex ${
            isTablet
              ? 'flex-row items-center justify-between'
              : 'flex-col gap-2'
          }`}
        >
          <View>
            <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Sucursales</Text>
            <Text className='font-sans text-zinc-500 dark:text-zinc-400'>
              Gestiona las sucursales de tu organizacion
            </Text>
          </View>
          <ButtonCustom
            title='+ Nueva Sucursal'
            onPress={() => {
              setSelectedBranch(null)
              setModal(true)
            }}
          />
        </View>

        <DataTable
          title='Sucursales'
          icon={Building}
          columns={[
            {
              key: 'nombre',
              label: 'Nombre',
              render: (val, row) => (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(branche)/[sucursalId]/inventario',
                      params: { sucursalId: String(row.id), sucursalNombre: row.nombre },
                    })
                  }
                >
                  <Text className="text-indigo-600 underline">{String(val)}</Text>
                </TouchableOpacity>
              )
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

        <BranchSummaryScreen branches={branches} />
      </View>

      <Modal isOpen={modal} onClose={closeModal}>
        <CreateBranchScreen
          defaultValues={selectBranch ? {
            nombre: selectBranch.nombre,
            direccion: selectBranch.direccion ?? '',
            encargadoId: selectBranch.encargadoId ?? null,
          } : undefined}
          onSubmit={(data) => {
            if (selectBranch) {
              updateBranch({
                id: selectBranch.id,
                nombre: data.nombre,
                direccion: data.direccion,
                encargadoId: data.encargadoId ?? undefined,
                activa: selectBranch.activa,
              })
            } else {
              createBranch({
                nombre: data.nombre,
                direccion: data.direccion,
                activa: true,
                encargadoId: data.encargadoId ?? undefined,
              })
            }
            closeModal()
          }}
        />
      </Modal>
    </View>
  )
}
