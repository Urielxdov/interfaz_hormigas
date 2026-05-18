import DataTable from '@/src/utils/components/DataTable'
import { Building2 } from 'lucide-react-native'
import { Text, View, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { BranchItemListDTO } from '@hormigas/application'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { getReporteRepo } from '@/src/adapters/reporteServiceInstance'
import { getInventarioRepos } from '@/src/adapters/inventarioServiceInstance'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

type SucursalRow = {
  nombre: string
  valorInventario: string
  productosConPrecio: number
  productosSinPrecio: number
  stockBajo: number
  estado: string
}

const getStatusColor = (estado: string | number): string => {
  const n = String(estado).toLowerCase()
  if (n === 'optimo') return 'bg-blue-200 text-blue-600'
  if (n === 'atencion') return 'bg-orange-200 text-orange-600'
  return 'text-gray-500'
}

async function buildRow(branch: BranchItemListDTO): Promise<SucursalRow> {
  try {
    const reporteRepo = await getReporteRepo()
    const { sqlite } = await getInventarioRepos()
    const [reporte, inventario] = await Promise.all([
      reporteRepo.valorInventario(Number(branch.id)),
      sqlite.findBySucursal(Number(branch.id)),
    ])
    const stockBajo = inventario.filter(i => i.stockActual < i.stockMinimo).length
    return {
      nombre: branch.nombre,
      valorInventario: `$${reporte.valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      productosConPrecio: reporte.productosConPrecio,
      productosSinPrecio: reporte.productosSinPrecio,
      stockBajo,
      estado: stockBajo > 0 ? 'Atencion' : 'Optimo',
    }
  } catch {
    return {
      nombre: branch.nombre,
      valorInventario: 'N/A',
      productosConPrecio: 0,
      productosSinPrecio: 0,
      stockBajo: 0,
      estado: 'Optimo',
    }
  }
}

export default function BranchSummaryScreen() {
  const { branches } = useBranches()
  const { isOnline } = useNetwork()
  const [rows, setRows] = useState<SucursalRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (branches.length === 0) return
    setLoading(true)
    Promise.all(branches.map(buildRow))
      .then(setRows)
      .finally(() => setLoading(false))
  }, [branches, isOnline])

  if (loading) {
    return (
      <View className="border rounded-xl border-gray-200 p-6 items-center">
        <ActivityIndicator />
      </View>
    )
  }

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
              <Text>{String(val)}</Text>
            </View>
          )
        },
        { key: 'productosConPrecio', label: 'Productos' },
        { key: 'stockBajo', label: 'Stock Bajo' },
        { key: 'valorInventario', label: 'Valor' },
        {
          key: 'estado',
          label: 'Estado',
          render: val => (
            <View>
              <Text className={`${getStatusColor(String(val))} rounded-xl p-1 text-center font-semibold`}>
                {String(val)}
              </Text>
            </View>
          )
        }
      ]}
      data={rows}
    />
  )
}
