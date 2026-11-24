import DataTable from '@/src/utils/components/DataTable'
import { BranchItemListDTO } from '@hormigas/application'
import { Building2 } from 'lucide-react-native'
import { router } from 'expo-router'
import { Text, View } from 'react-native'

interface BranchSummaryProps {
  branches: BranchItemListDTO[]
}

type Row = { id: string; nombre: string; direccion: string; responsable: string; activa: boolean }

export default function BranchSummaryScreen({ branches }: BranchSummaryProps) {
  return (
    <DataTable<Row>
      title='Sucursales'
      description='Estado de cada ubicación'
      icon={Building2}
      emptyMessage='Aún no hay sucursales. Créalas en la pestaña Sucursales.'
      keyExtractor={row => row.id}
      onRowPress={row => router.push({
        pathname: '/(branche)/[sucursalId]/detalle',
        params: { sucursalId: row.id, sucursalNombre: row.nombre },
      })}
      columns={[
        { key: 'nombre', label: 'Sucursal', primary: true },
        { key: 'direccion', label: 'Dirección', secondary: true },
        { key: 'responsable', label: 'Responsable' },
        {
          key: 'activa',
          label: 'Estado',
          badge: true,
          render: val => (
            <View className={`rounded-full px-2 py-0.5 self-start ${val ? 'bg-green-100 dark:bg-green-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              <Text className={`font-sans-semibold text-xs ${val ? 'text-green-700 dark:text-green-400' : 'text-zinc-500'}`}>
                {val ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
          ),
        },
      ]}
      data={branches.map(b => ({
        id: String(b.id),
        nombre: b.nombre,
        direccion: b.direccion ?? '',
        responsable: b.responsable ?? 'Sin asignar',
        activa: b.activa,
      }))}
    />
  )
}
