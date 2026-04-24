import DataTable from '@/src/utils/components/DataTable'
import { statusClass } from '@/src/utils/helpers/ColorHerlper'
import { Building2 } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { DashboardData } from '../hooks/useDashboard'

type Props = { dashboard: DashboardData }

export default function BranchSummaryScreen({ dashboard }: Props) {
  const { branches, isLoading } = dashboard

  if (isLoading || branches.length === 0) return null

  return (
    <DataTable
      title='Sucursales'
      description='Estado de tus sucursales'
      icon={Building2}
      columns={[
        {
          key: 'nombre',
          label: 'Sucursal',
          render: val => (
            <View className='flex flex-row items-center gap-1'>
              <View className='rounded-xl bg-blue-100 p-1'>
                <Building2 size={20} color='#1d4ed8' />
              </View>
              <Text>{val}</Text>
            </View>
          )
        },
        { key: 'direccion', label: 'Dirección' },
        { key: 'responsable', label: 'Responsable' },
        {
          key: 'activa',
          label: 'Estado',
          render: val => (
            <Text className={statusClass(val ? 'blue' : 'gray')}>
              {val ? 'Activa' : 'Inactiva'}
            </Text>
          )
        },
      ]}
      data={branches}
    />
  )
}
