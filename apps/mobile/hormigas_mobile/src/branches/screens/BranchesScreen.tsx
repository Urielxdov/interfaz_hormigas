import BranchMovimientosSection from '@/src/branches/components/BranchMovimientosSection'
import CreateBranchScreen from '@/src/branches/screens/CreateBranch'
import { useAuth } from '@/src/login/hooks/useAuth'
import ButtonCustom from '@/src/utils/components/ButtonCustom'
import DataTable from '@/src/utils/components/DataTable'
import Modal from '@/src/utils/components/Modal'
import { statusClass } from '@/src/utils/helpers/ColorHerlper'
import useIsTablet from '@/src/utils/hooks/useIsTablet'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { BranchItemTableDTO } from '@/interfaces/Branch'
import { BranchMapper } from '@/mappers/BranchMapper'
import { router } from 'expo-router'
import { Building2, Eye, Pencil, Power } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

export default function BranchesScreen() {
  const [modal, setModal] = useState(false)
  const isTablet = useIsTablet()
  const [selectBranch, setSelectedBranch] = useState<BranchItemTableDTO | null>(null)
  const { branches, toggleStatus, updateBranch, createBranch } = useBranches()
  const { isAdminEmpresa } = useAuth()

  const mappedBranches: BranchItemTableDTO[] = branches.map(branch =>
    BranchMapper.toListTable(branch)
  )

  const closeModal = () => {
    setModal(false)
    setSelectedBranch(null)
  }

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Header */}
        <View
          className={`flex ${
            isTablet ? 'flex-row items-center justify-between' : 'flex-col gap-3'
          }`}
        >
          <View className='gap-0.5'>
            <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Sucursales</Text>
            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>
              Gestiona las ubicaciones de tu organización
            </Text>
          </View>
          {isAdminEmpresa && (
            <ButtonCustom
              title='+ Nueva Sucursal'
              onPress={() => {
                setSelectedBranch(null)
                setModal(true)
              }}
            />
          )}
        </View>

        {/* Branches table */}
        <DataTable
          title='Sucursales'
          description={`${branches.filter(b => b.activa).length} activas de ${branches.length}`}
          icon={Building2}
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
                  <Text className='text-indigo-600 dark:text-indigo-400 font-sans-medium underline'>
                    {String(val)}
                  </Text>
                </TouchableOpacity>
              ),
            },
            {
              key: 'direccion',
              label: 'Dirección',
            },
            {
              key: 'responsable',
              label: 'Responsable',
            },
            {
              key: 'activa',
              label: 'Estado',
              render: val => (
                <View
                  className={`rounded-xl px-2 py-0.5 self-start ${
                    val ? 'bg-green-100 dark:bg-green-900/30' : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  <Text
                    className={`font-sans-semibold text-xs ${
                      val ? 'text-green-700 dark:text-green-400' : 'text-zinc-500'
                    }`}
                  >
                    {val ? 'Activa' : 'Inactiva'}
                  </Text>
                </View>
              ),
            },
            {
              key: 'acciones',
              label: 'Acciones',
              render: (_, row) => (
                <View className='flex-row gap-1.5'>
                  <ButtonCustom
                    onPress={() =>
                      router.push({
                        pathname: '/(branche)/[sucursalId]/detalle',
                        params: { sucursalId: String(row.id), sucursalNombre: row.nombre },
                      })
                    }
                    bgColor='bg-indigo-500'
                    icon={Eye}
                    iconSize={15}
                    compact
                  />
                  {isAdminEmpresa && (
                    <>
                      <ButtonCustom
                        onPress={() => {
                          setSelectedBranch(row)
                          setModal(true)
                        }}
                        bgColor='bg-blue-500'
                        icon={Pencil}
                        iconSize={15}
                        compact
                      />
                      <ButtonCustom
                        onPress={() => toggleStatus(row.id)}
                        bgColor={row.activa ? 'bg-green-500' : 'bg-red-500'}
                        icon={Power}
                        iconSize={15}
                        compact
                      />
                    </>
                  )}
                </View>
              ),
            },
          ]}
          data={mappedBranches}
        />

        {/* Activity per branch */}
        <BranchMovimientosSection branches={branches} />
      </ScrollView>

      <Modal isOpen={modal && isAdminEmpresa} onClose={closeModal}>
        <CreateBranchScreen
          defaultValues={
            selectBranch
              ? {
                  nombre: selectBranch.nombre,
                  direccion: selectBranch.direccion ?? '',
                  encargadoId: selectBranch.encargadoId ?? null,
                }
              : undefined
          }
          onSubmit={data => {
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
