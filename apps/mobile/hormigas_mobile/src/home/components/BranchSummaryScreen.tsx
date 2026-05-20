import DataTable from '@/src/utils/components/DataTable'
import { BranchItemListDTO } from '@hormigas/application'
import { Building2 } from 'lucide-react-native'
import { Text, View } from 'react-native'

interface BranchSummaryProps {
  branches: BranchItemListDTO[]
}

export default function BranchSummaryScreen({ branches }: BranchSummaryProps) {
  return (
    <DataTable
      title='Sucursales'
      description='Estado de cada ubicación'
      icon={Building2}
      columns={[
        {
          key: 'nombre',
          label: 'Sucursal',
          render: val => (
            <View className='flex-row items-center gap-1'>
              <View className='rounded-xl bg-blue-100 p-1'>
                <Building2 size={18} color='#1d4ed8' />
              </View>
              <Text className='font-sans text-zinc-800 dark:text-zinc-200 text-sm'>{val}</Text>
            </View>
          ),
        },
        {
          key: 'responsable',
          label: 'Responsable',
          render: val => (
            <Text className='font-sans text-zinc-600 dark:text-zinc-400 text-sm'>
              {val ?? '—'}
            </Text>
          ),
        },
        {
          key: 'activa',
          label: 'Estado',
          render: val => (
            <View className={`rounded-xl px-2 py-0.5 self-start ${val ? 'bg-green-100' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              <Text className={`font-sans-semibold text-xs ${val ? 'text-green-700' : 'text-zinc-500'}`}>
                {val ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
          ),
        },
      ]}
      data={branches.map(b => ({
        nombre: b.nombre,
        responsable: b.responsable,
        activa: b.activa,
      }))}
    />
  )
}
