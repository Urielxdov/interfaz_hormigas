import DataTable from '@/src/utils/components/DataTable'
import { Building2 } from 'lucide-react-native'
import { Text, View } from 'react-native'

const sucursales = [
  {
    nombre: 'Centro',
    totalProductos: 847,
    stockBajo: 8,
    valorInventario: '$1,245,800',
    movimiento: '+12.5%',
    estado: 'Optimo'
  },
  {
    nombre: 'Norte',
    totalProductos: 623,
    stockBajo: 5,
    valorInventario: '$892,400',
    movimiento: '+8.3%',
    estado: 'Optimo'
  },
  {
    nombre: 'Sur',
    totalProductos: 456,
    stockBajo: 12,
    valorInventario: '$645,200',
    movimiento: '+5.1%',
    estado: 'Atencion'
  },
  {
    nombre: 'Este',
    totalProductos: 534,
    stockBajo: 3,
    valorInventario: '$756,900',
    movimiento: '+15.2%',
    estado: 'Optimo'
  },
  {
    nombre: 'Oeste',
    totalProductos: 387,
    stockBajo: 7,
    valorInventario: '$534,500',
    movimiento: '+3.8%',
    estado: 'Optimo'
  }
]

const getStatusColor = (estado: string | number): string => {
  const normalized = String(estado).toLowerCase()

  if (normalized === 'optimo') return 'bg-blue-200 text-blue-600'
  if (normalized === 'atencion') return 'bg-orange-200 text-orange-600'
  if (normalized === 'bajo') return 'bg-red-200 text-red-600'

  return 'text-gray-500'
}

export default function BranchSummaryScreen () {
  return (
    <DataTable
      title='Resumen por Sucursal'
      description='Vista general del inventario en cada ubicacion'
      icon={Building2}
      columns={[
        {
          key: 'nombre',
          label: 'Sucursal',
          render: val => (
            <View className='flex flex-row items-center gap-1'>
              <View className='rounded-xl bg-blue-100 p-1'>
                <Building2 size={24} color='#1d4ed8' />
              </View>
              <Text>{val}</Text>
            </View>
          )
        },
        { key: 'totalProductos', label: 'Total Productos' },
        { key: 'stockBajo', label: 'Stock Bajo' },
        { key: 'valorInventario', label: 'Valor inventario' },
        { key: 'movimiento', label: 'Movimiento' },
        {
          key: 'estado',
          label: 'Estado',
          render: val => (
            <View>
              <Text className={`${getStatusColor(val)} rounded-xl p-1 text-center font-semibold`}>
                {val}
              </Text>
            </View>
          )
        }
      ]}
      data={sucursales}
    />
  )
}
