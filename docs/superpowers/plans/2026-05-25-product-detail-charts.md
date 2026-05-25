# Detalle de Producto con Gráficas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pantalla de detalle de producto con gráficas de stock y movimientos por sucursal, accesible desde la tabla de productos.

**Architecture:** Backend expone `stockAnterior`/`stockNuevo` en el DTO de movimientos. Frontend agrega método `buscarPorProducto` al servicio, crea ruta `(product-detail)/[localId]` y renderiza gráficas con `react-native-gifted-charts` separadas en componentes independientes.

**Tech Stack:** React Native, Expo Router 6, react-native-gifted-charts, react-native-svg (ya instalado), Spring Boot (backend)

---

## File Map

| Archivo | Acción |
|---|---|
| `hormigas/.../movimiento/dto/MovimientoResponseDTO.java` | Modificar — agregar `stockAnterior`, `stockNuevo` |
| `hormigas/.../movimiento/mapper/MovimientoMapper.java` | Modificar — mapear nuevos campos |
| `packages/application/services/movimiento.service.ts` | Modificar — DTO + interfaz + método `buscarPorProducto` |
| `apps/mobile/.../adapters/movimientoServiceInstance.ts` | Modificar — agregar `buscarPorProducto` al objeto `api` |
| `apps/mobile/hormigas_mobile/app/(product-detail)/_layout.tsx` | Crear — Stack slide_from_right |
| `apps/mobile/hormigas_mobile/app/(product-detail)/[localId].tsx` | Crear — wrapper de ruta |
| `apps/mobile/.../src/product/utils/chartHelpers.ts` | Crear — funciones puras de cálculo de datos |
| `apps/mobile/.../src/product/hooks/useProductDetail.ts` | Crear — lógica de datos |
| `apps/mobile/.../src/product/components/TrendBadge.tsx` | Crear — badge de tendencia |
| `apps/mobile/.../src/product/components/StockLineChart.tsx` | Crear — gráfica línea de stock |
| `apps/mobile/.../src/product/components/MovimientosBarChart.tsx` | Crear — gráfica barras movimientos |
| `apps/mobile/.../src/product/components/BranchProductCard.tsx` | Crear — card contenedor con gráficas |
| `apps/mobile/.../src/product/screens/ProductDetailScreen.tsx` | Crear — pantalla principal |
| `apps/mobile/.../src/product/screens/ProductHomeScreen.tsx` | Modificar — botón chart en columna acciones |

---

## Task 1: Backend — exponer stockAnterior y stockNuevo

**Files:**
- Modify: `/home/uhernand/hormigas/src/main/java/com/example/hormigas/movimiento/dto/MovimientoResponseDTO.java`
- Modify: `/home/uhernand/hormigas/src/main/java/com/example/hormigas/movimiento/mapper/MovimientoMapper.java`

- [ ] **Step 1: Actualizar MovimientoResponseDTO.java**

Reemplazar todo el contenido del archivo:

```java
package com.example.hormigas.movimiento.dto;

import com.example.hormigas.movimiento.entity.TipoMovimiento;

import java.time.LocalDateTime;

public record MovimientoResponseDTO(
        Long id,
        Long productoId,
        String productoNombre,
        Long sucursalId,
        String sucursalNombre,
        TipoMovimiento tipoMovimiento,
        int cantidad,
        String usuarioNombre,
        String referencia,
        LocalDateTime fecha,
        int stockAnterior,
        int stockNuevo
) {}
```

- [ ] **Step 2: Actualizar MovimientoMapper.java**

Reemplazar todo el contenido del archivo:

```java
package com.example.hormigas.movimiento.mapper;

import com.example.hormigas.movimiento.dto.MovimientoResponseDTO;
import com.example.hormigas.movimiento.entity.Movimiento;

public class MovimientoMapper {

    public static MovimientoResponseDTO toResponse(Movimiento movimiento) {
        Long productoId = movimiento.getInventario() != null && movimiento.getInventario().getProducto() != null
                ? movimiento.getInventario().getProducto().getId()
                : null;
        String productoNombre = movimiento.getInventario() != null && movimiento.getInventario().getProducto() != null
                ? movimiento.getInventario().getProducto().getNombre()
                : null;

        Long sucursalId = movimiento.getInventario() != null && movimiento.getInventario().getSucursal() != null
                ? movimiento.getInventario().getSucursal().getId()
                : null;
        String sucursalNombre = movimiento.getInventario() != null && movimiento.getInventario().getSucursal() != null
                ? movimiento.getInventario().getSucursal().getNombre()
                : null;

        String usuarioNombre = movimiento.getUsuario() != null
                ? movimiento.getUsuario().getNombre()
                : null;

        return new MovimientoResponseDTO(
                movimiento.getId(),
                productoId,
                productoNombre,
                sucursalId,
                sucursalNombre,
                movimiento.getTipoMovimiento(),
                movimiento.getCantidad(),
                usuarioNombre,
                movimiento.getReferencia(),
                movimiento.getFecha(),
                movimiento.getStockAnterior(),
                movimiento.getStockNuevo()
        );
    }
}
```

- [ ] **Step 3: Compilar backend**

```bash
cd /home/uhernand/hormigas && ./mvnw compile -q
```
Expected: BUILD SUCCESS sin errores.

- [ ] **Step 4: Commit**

```bash
cd /home/uhernand/hormigas
git add src/main/java/com/example/hormigas/movimiento/dto/MovimientoResponseDTO.java
git add src/main/java/com/example/hormigas/movimiento/mapper/MovimientoMapper.java
git commit -m "feat(movimiento): exponer stockAnterior y stockNuevo en DTO de respuesta"
```

---

## Task 2: Application layer — tipos y método buscarPorProducto

**Files:**
- Modify: `packages/application/services/movimiento.service.ts`

- [ ] **Step 1: Agregar campos y método al archivo**

Reemplazar las interfaces `MovimientoDTO` e `IMovimientoApi` y agregar método a `MovimientoSyncService` en `/home/uhernand/interfaz_hormigas/packages/application/services/movimiento.service.ts`:

```ts
export interface MovimientoDTO {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  tipoMovimiento: 'ENTRADA' | 'SALIDA'
  cantidad: number
  usuarioNombre: string
  referencia?: string
  fecha: string
  stockAnterior?: number
  stockNuevo?: number
}
```

```ts
export interface IMovimientoApi {
  crear(dto: Omit<CrearMovimientoDTO, 'inventarioId'>): Promise<MovimientoDTO>
  listar(sucursalId?: number): Promise<MovimientoDTO[]>
  stockBajo(): Promise<InventarioResponseDTO[]>
  inventarioPorSucursal(sucursalId: number): Promise<InventarioResponseDTO[]>
  buscarPorProducto(productoId: number, sucursalId?: number): Promise<MovimientoDTO[]>
}
```

Agregar método al final de la clase `MovimientoSyncService` (antes del cierre `}`):

```ts
  async buscarPorProducto(productoId: number, sucursalId?: number): Promise<MovimientoDTO[]> {
    return this.api.buscarPorProducto(productoId, sucursalId)
  }
```

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
cd /home/uhernand/interfaz_hormigas && pnpm --filter @hormigas/application build 2>&1 | tail -5
```
Expected: sin errores de tipos.

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add packages/application/services/movimiento.service.ts
git commit -m "feat(movimiento): agregar stockAnterior/stockNuevo al DTO y método buscarPorProducto"
```

---

## Task 3: Adapter — implementar buscarPorProducto

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts`

- [ ] **Step 1: Agregar buscarPorProducto al objeto api**

En `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts`, dentro de `_initPromise`, agregar al objeto `api: IMovimientoApi`:

```ts
const api: IMovimientoApi = {
  crear: (dto: Omit<CrearMovimientoDTO, 'inventarioId'>) =>
    http.post<MovimientoDTO>('/api/movimiento/crear', dto),
  listar: (sucursalId?: number) => {
    const params = sucursalId != null ? `?sucursalId=${sucursalId}` : ''
    return http.get<MovimientoDTO[]>(`/api/movimiento/buscar${params}`)
  },
  stockBajo: () =>
    http.get<InventarioResponseDTO[]>('/api/inventario/stockBajo'),
  inventarioPorSucursal: (sucursalId: number) =>
    http.get<InventarioResponseDTO[]>(`/api/inventario/porSucursal?sucursalId=${sucursalId}`),
  buscarPorProducto: (productoId: number, sucursalId?: number) => {
    const params = new URLSearchParams({ productoId: String(productoId) })
    if (sucursalId != null) params.set('sucursalId', String(sucursalId))
    return http.get<MovimientoDTO[]>(`/api/movimiento/buscar?${params}`)
  },
}
```

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
cd /home/uhernand/interfaz_hormigas && pnpm --filter hormigas_mobile tsc --noEmit 2>&1 | grep -i "error" | head -10
```
Expected: sin errores en el adapter.

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts
git commit -m "feat(adapter): implementar buscarPorProducto en movimientoServiceInstance"
```

---

## Task 4: Instalar react-native-gifted-charts

**Files:** `apps/mobile/hormigas_mobile/package.json`

- [ ] **Step 1: Instalar librería**

```bash
cd /home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile && npx expo install react-native-gifted-charts
```
Expected: package.json actualizado con `react-native-gifted-charts`.

- [ ] **Step 2: Verificar que react-native-svg sigue instalado**

```bash
cat /home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/package.json | grep -E "gifted-charts|react-native-svg"
```
Expected: ambos presentes.

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/package.json apps/mobile/hormigas_mobile/pnpm-lock.yaml 2>/dev/null; git add pnpm-lock.yaml 2>/dev/null; true
git commit -m "feat(deps): agregar react-native-gifted-charts"
```

---

## Task 5: Rutas de navegación

**Files:**
- Create: `apps/mobile/hormigas_mobile/app/(product-detail)/_layout.tsx`
- Create: `apps/mobile/hormigas_mobile/app/(product-detail)/[localId].tsx`

- [ ] **Step 1: Crear layout con slide_from_right**

Crear `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/app/(product-detail)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router'

export default function ProductDetailLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        animationDuration: 280,
        headerShown: false,
      }}
    />
  )
}
```

- [ ] **Step 2: Crear wrapper de ruta**

Crear `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/app/(product-detail)/[localId].tsx`:

```tsx
import { useLocalSearchParams } from 'expo-router'
import ProductDetailScreen from '@/src/product/screens/ProductDetailScreen'

export default function ProductDetailPage() {
  const { localId } = useLocalSearchParams<{ localId: string }>()
  return <ProductDetailScreen localId={localId} />
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add "apps/mobile/hormigas_mobile/app/(product-detail)/_layout.tsx"
git add "apps/mobile/hormigas_mobile/app/(product-detail)/[localId].tsx"
git commit -m "feat(nav): agregar ruta (product-detail)/[localId] con slide_from_right"
```

---

## Task 6: chartHelpers — funciones puras de cálculo

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/product/utils/chartHelpers.ts`

- [ ] **Step 1: Crear archivo de helpers**

Crear `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/product/utils/chartHelpers.ts`:

```ts
import { MovimientoDTO } from '@hormigas/application'

const TIPOS_SALIDA = new Set([
  'SALIDA', 'VENTA', 'MERMA', 'TRASLADO_SALIDA', 'DEVOLUCION_CLIENTE',
])

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })

export interface LineDataPoint {
  value: number
  label?: string
}

export interface BarDataPoint {
  value: number
  label: string
  frontColor: string
}

export function computeLineData(movimientos: MovimientoDTO[]): LineDataPoint[] {
  return movimientos
    .filter(m => m.stockNuevo !== undefined)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map(m => ({
      value: m.stockNuevo ?? 0,
      label: formatFecha(m.fecha),
    }))
}

export function computeBarData(movimientos: MovimientoDTO[]): BarDataPoint[] {
  const byDate = movimientos.reduce<Record<string, { entradas: number; salidas: number }>>(
    (acc, m) => {
      const date = m.fecha.slice(0, 10)
      if (!acc[date]) acc[date] = { entradas: 0, salidas: 0 }
      if (TIPOS_SALIDA.has(m.tipoMovimiento)) acc[date].salidas += m.cantidad
      else acc[date].entradas += m.cantidad
      return acc
    },
    {}
  )

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, { entradas, salidas }]) => {
      const label = formatFecha(date + 'T00:00:00')
      const result: BarDataPoint[] = []
      if (entradas > 0) result.push({ value: entradas, label, frontColor: '#059669' })
      if (salidas > 0) result.push({ value: salidas, label: entradas > 0 ? '' : label, frontColor: '#dc2626' })
      return result
    })
}

export function computeTrend(movimientos: MovimientoDTO[]): number | null {
  const now = new Date()
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - now.getDay())
  startOfThisWeek.setHours(0, 0, 0, 0)
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

  const thisWeek = movimientos.filter(m => new Date(m.fecha) >= startOfThisWeek).length
  const lastWeek = movimientos.filter(m => {
    const d = new Date(m.fecha)
    return d >= startOfLastWeek && d < startOfThisWeek
  }).length

  if (lastWeek === 0) return null
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/product/utils/chartHelpers.ts
git commit -m "feat(product): agregar chartHelpers con computeLineData, computeBarData, computeTrend"
```

---

## Task 7: useProductDetail hook

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/product/hooks/useProductDetail.ts`

- [ ] **Step 1: Crear hook**

Crear `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/product/hooks/useProductDetail.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import { MovimientoDTO } from '@hormigas/application'
import { Product } from '@hormigas/domain'
import { BranchItemListDTO } from '@hormigas/application'
import { getProductService } from '@/src/adapters/productServiceInstance'
import { getMovimientoService } from '@/src/adapters/movimientoServiceInstance'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

export function useProductDetail(localId: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [allMovimientos, setAllMovimientos] = useState<MovimientoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [notSynced, setNotSynced] = useState(false)
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'todas'>('todas')
  const { branches } = useBranches()
  const { isOnline } = useNetwork()

  const load = useCallback(async () => {
    setLoading(true)
    setNotSynced(false)
    try {
      const productSvc = await getProductService()
      const all = await productSvc.findAll()
      const found = all.find(p => p.localId === localId) ?? null
      setProduct(found)

      if (!found?.categoriaId) {
        setNotSynced(true)
        return
      }

      if (!isOnline) return

      const movSvc = await getMovimientoService()
      const data = await movSvc.buscarPorProducto(found.categoriaId)
      setAllMovimientos(data)
    } catch (e) {
      console.error('[useProductDetail]', e)
    } finally {
      setLoading(false)
    }
  }, [localId, isOnline])

  useEffect(() => { load() }, [load])

  const movimientos =
    selectedBranchId === 'todas'
      ? allMovimientos
      : allMovimientos.filter(m => m.sucursalId === selectedBranchId)

  const branchesWithMovimientos = branches.filter(b =>
    allMovimientos.some(m => m.sucursalId === Number(b.id))
  )

  return {
    product,
    movimientos,
    allMovimientos,
    branches,
    branchesWithMovimientos,
    loading,
    notSynced,
    selectedBranchId,
    setSelectedBranchId,
  }
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd /home/uhernand/interfaz_hormigas && pnpm --filter hormigas_mobile tsc --noEmit 2>&1 | grep "useProductDetail" | head -5
```
Expected: sin errores relacionados al hook.

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/product/hooks/useProductDetail.ts
git commit -m "feat(product): agregar useProductDetail hook"
```

---

## Task 8: TrendBadge component

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/product/components/TrendBadge.tsx`

- [ ] **Step 1: Crear componente**

Crear `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/product/components/TrendBadge.tsx`:

```tsx
import { View, Text } from 'react-native'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native'

interface TrendBadgeProps {
  percent: number | null
}

export default function TrendBadge({ percent }: TrendBadgeProps) {
  if (percent === null) {
    return (
      <View className='flex-row items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1'>
        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>Sin datos sem.</Text>
      </View>
    )
  }

  if (percent > 0) {
    return (
      <View className='flex-row items-center gap-1 bg-green-100 dark:bg-green-900/30 rounded-full px-3 py-1'>
        <TrendingUp size={11} color='#059669' />
        <Text className='font-sans-semibold text-green-700 dark:text-green-400 text-xs'>
          ↑ {percent}% esta sem.
        </Text>
      </View>
    )
  }

  if (percent < 0) {
    return (
      <View className='flex-row items-center gap-1 bg-red-100 dark:bg-red-900/30 rounded-full px-3 py-1'>
        <TrendingDown size={11} color='#dc2626' />
        <Text className='font-sans-semibold text-red-700 dark:text-red-400 text-xs'>
          ↓ {Math.abs(percent)}% esta sem.
        </Text>
      </View>
    )
  }

  return (
    <View className='flex-row items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1'>
      <Minus size={11} color='#71717a' />
      <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs'>Sin cambio</Text>
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/product/components/TrendBadge.tsx
git commit -m "feat(product): agregar TrendBadge component"
```

---

## Task 9: StockLineChart component

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/product/components/StockLineChart.tsx`

- [ ] **Step 1: Crear componente**

Crear `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/product/components/StockLineChart.tsx`:

```tsx
import { View, Text, useWindowDimensions, useColorScheme } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { LineDataPoint } from '../utils/chartHelpers'

interface StockLineChartProps {
  data: LineDataPoint[]
}

export default function StockLineChart({ data }: StockLineChartProps) {
  const { width } = useWindowDimensions()
  const isDark = useColorScheme() === 'dark'
  const chartWidth = width - 96

  const axisColor = isDark ? '#3f3f46' : '#e4e4e7'
  const labelColor = isDark ? '#71717a' : '#a1a1aa'

  if (data.length === 0) {
    return (
      <View className='items-center py-6'>
        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-sm'>Sin datos de stock</Text>
      </View>
    )
  }

  const spacing = Math.max(32, Math.min(80, (chartWidth - 40) / Math.max(data.length - 1, 1)))
  const showAllLabels = data.length <= 8
  const displayData = showAllLabels
    ? data
    : data.map((d, i) => ({
        ...d,
        label: i % Math.ceil(data.length / 6) === 0 ? d.label : '',
      }))

  return (
    <LineChart
      data={displayData}
      color='#6366f1'
      thickness={2}
      areaChart
      startFillColor='#6366f1'
      endFillColor='#6366f1'
      startOpacity={0.18}
      endOpacity={0}
      curved
      dataPointsColor='#6366f1'
      dataPointsRadius={4}
      width={chartWidth}
      spacing={spacing}
      yAxisTextStyle={{ color: labelColor, fontSize: 10, fontFamily: 'Inter_400Regular' }}
      xAxisLabelTextStyle={{ color: labelColor, fontSize: 9, fontFamily: 'Inter_400Regular' }}
      rulesColor={axisColor}
      yAxisColor={axisColor}
      xAxisColor={axisColor}
      noOfSections={4}
      yAxisTextNumberOfLines={1}
      hideYAxisText={false}
      initialSpacing={12}
      endSpacing={12}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/product/components/StockLineChart.tsx
git commit -m "feat(product): agregar StockLineChart component con gifted-charts"
```

---

## Task 10: MovimientosBarChart component

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/product/components/MovimientosBarChart.tsx`

- [ ] **Step 1: Crear componente**

Crear `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/product/components/MovimientosBarChart.tsx`:

```tsx
import { View, Text, useWindowDimensions, useColorScheme } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import { BarDataPoint } from '../utils/chartHelpers'

interface MovimientosBarChartProps {
  data: BarDataPoint[]
}

export default function MovimientosBarChart({ data }: MovimientosBarChartProps) {
  const { width } = useWindowDimensions()
  const isDark = useColorScheme() === 'dark'
  const chartWidth = width - 96

  const axisColor = isDark ? '#3f3f46' : '#e4e4e7'
  const labelColor = isDark ? '#71717a' : '#a1a1aa'

  if (data.length === 0) {
    return (
      <View className='items-center py-6'>
        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-sm'>Sin movimientos</Text>
      </View>
    )
  }

  const barWidth = Math.max(10, Math.min(26, (chartWidth / Math.max(data.length, 1)) - 8))
  const spacing = Math.max(4, barWidth * 0.25)

  return (
    <BarChart
      data={data}
      barWidth={barWidth}
      spacing={spacing}
      roundedTop
      width={chartWidth}
      yAxisTextStyle={{ color: labelColor, fontSize: 10, fontFamily: 'Inter_400Regular' }}
      xAxisLabelTextStyle={{ color: labelColor, fontSize: 9, fontFamily: 'Inter_400Regular' }}
      rulesColor={axisColor}
      yAxisColor={axisColor}
      xAxisColor={axisColor}
      noOfSections={4}
      initialSpacing={8}
      endSpacing={8}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/product/components/MovimientosBarChart.tsx
git commit -m "feat(product): agregar MovimientosBarChart component con gifted-charts"
```

---

## Task 11: BranchProductCard component

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/product/components/BranchProductCard.tsx`

- [ ] **Step 1: Crear componente**

Crear `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/product/components/BranchProductCard.tsx`:

```tsx
import { View, Text } from 'react-native'
import { MovimientoDTO } from '@hormigas/application'
import StockLineChart from './StockLineChart'
import MovimientosBarChart from './MovimientosBarChart'
import TrendBadge from './TrendBadge'
import { computeLineData, computeBarData, computeTrend } from '../utils/chartHelpers'

interface BranchProductCardProps {
  sucursalNombre: string
  movimientos: MovimientoDTO[]
}

export default function BranchProductCard({ sucursalNombre, movimientos }: BranchProductCardProps) {
  const lineData = computeLineData(movimientos)
  const barData = computeBarData(movimientos)
  const trendPercent = computeTrend(movimientos)
  const stockActual = lineData.length > 0 ? lineData[lineData.length - 1].value : null

  return (
    <View className='bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 overflow-hidden mb-4'>
      {/* Header */}
      <View className='px-4 pt-4 pb-3 flex-row items-start justify-between gap-2'>
        <View className='flex-1'>
          <Text
            className='font-sans-bold text-zinc-900 dark:text-zinc-50 text-base'
            numberOfLines={1}
          >
            {sucursalNombre}
          </Text>
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs mt-0.5'>
            {movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''}
            {stockActual !== null ? `  •  Stock: ${stockActual} uds` : ''}
          </Text>
        </View>
        <TrendBadge percent={trendPercent} />
      </View>

      {/* Stock line chart */}
      <View className='border-t border-stone-50 dark:border-zinc-800 px-4 pt-3 pb-2'>
        <Text className='font-sans-medium text-zinc-500 dark:text-zinc-400 text-xs mb-3 uppercase tracking-wide'>
          Stock a lo largo del tiempo
        </Text>
        <StockLineChart data={lineData} />
      </View>

      {/* Bar chart */}
      <View className='border-t border-stone-50 dark:border-zinc-800 px-4 pt-3 pb-4'>
        <View className='flex-row items-center gap-3 mb-3'>
          <Text className='font-sans-medium text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide'>
            Entradas y salidas por día
          </Text>
          <View className='flex-row gap-2'>
            <View className='flex-row items-center gap-1'>
              <View className='w-2 h-2 rounded-full bg-green-500' />
              <Text className='font-sans text-zinc-400 text-xs'>Entrada</Text>
            </View>
            <View className='flex-row items-center gap-1'>
              <View className='w-2 h-2 rounded-full bg-red-500' />
              <Text className='font-sans text-zinc-400 text-xs'>Salida</Text>
            </View>
          </View>
        </View>
        <MovimientosBarChart data={barData} />
      </View>
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/product/components/BranchProductCard.tsx
git commit -m "feat(product): agregar BranchProductCard con StockLineChart y MovimientosBarChart"
```

---

## Task 12: ProductDetailScreen

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/product/screens/ProductDetailScreen.tsx`

- [ ] **Step 1: Crear pantalla**

Crear `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/product/screens/ProductDetailScreen.tsx`:

```tsx
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { AlertCircle, ArrowLeft, WifiOff } from 'lucide-react-native'
import SelectField from '@/src/utils/components/SelectField'
import BranchProductCard from '../components/BranchProductCard'
import { useProductDetail } from '../hooks/useProductDetail'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

interface Props {
  localId: string
}

export default function ProductDetailScreen({ localId }: Props) {
  const {
    product,
    movimientos,
    allMovimientos,
    branches,
    branchesWithMovimientos,
    loading,
    notSynced,
    selectedBranchId,
    setSelectedBranchId,
  } = useProductDetail(localId)
  const { isOnline } = useNetwork()

  const branchOptions = [
    { label: 'Todas las sucursales', value: 'todas' as string | number },
    ...branchesWithMovimientos.map(b => ({ label: b.nombre, value: Number(b.id) })),
  ]

  const branchGroups =
    selectedBranchId === 'todas'
      ? branchesWithMovimientos.map(b => ({
          branch: b,
          movimientos: allMovimientos.filter(m => m.sucursalId === Number(b.id)),
        }))
      : []

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      {/* Header */}
      <View className='bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 flex-row items-center gap-3'>
        <TouchableOpacity onPress={() => router.back()} className='p-2 -ml-2 rounded-xl'>
          <ArrowLeft size={20} color='#71717a' />
        </TouchableOpacity>
        <View className='flex-1'>
          <Text
            className='font-sans-bold text-xl text-zinc-900 dark:text-zinc-50'
            numberOfLines={1}
          >
            {product?.nombre ?? 'Producto'}
          </Text>
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-xs'>
            {product?.sku ?? ''}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* No sincronizado */}
        {notSynced && (
          <View className='bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800 flex-row items-start gap-3'>
            <AlertCircle size={18} color='#d97706' />
            <Text className='font-sans text-amber-800 dark:text-amber-300 text-sm flex-1'>
              Producto no sincronizado. Conecta internet y espera la sincronización para ver datos.
            </Text>
          </View>
        )}

        {/* Sin conexión */}
        {!isOnline && !notSynced && (
          <View className='bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-4 flex-row items-center gap-3'>
            <WifiOff size={16} color='#71717a' />
            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>
              Sin conexión — los datos no se pueden cargar
            </Text>
          </View>
        )}

        {/* Selector de sucursal */}
        {!notSynced && (
          <SelectField
            label='Sucursal'
            options={branchOptions}
            value={selectedBranchId}
            onChange={v => setSelectedBranchId(v === 'todas' ? 'todas' : Number(v))}
          />
        )}

        {/* Loading */}
        {loading && (
          <ActivityIndicator color='#6366f1' style={{ marginTop: 24 }} />
        )}

        {/* Sin movimientos */}
        {!loading && !notSynced && movimientos.length === 0 && isOnline && (
          <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-center mt-8'>
            Sin movimientos registrados para este producto
          </Text>
        )}

        {/* Vista "todas" — una card por sucursal */}
        {!loading && selectedBranchId === 'todas' &&
          branchGroups.map(({ branch, movimientos: branchMovs }) => (
            <BranchProductCard
              key={String(branch.id)}
              sucursalNombre={branch.nombre}
              movimientos={branchMovs}
            />
          ))}

        {/* Vista sucursal específica */}
        {!loading && selectedBranchId !== 'todas' && movimientos.length > 0 && (
          <BranchProductCard
            sucursalNombre={
              branches.find(b => Number(b.id) === selectedBranchId)?.nombre ?? ''
            }
            movimientos={movimientos}
          />
        )}
      </ScrollView>
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/product/screens/ProductDetailScreen.tsx
git commit -m "feat(product): agregar ProductDetailScreen con selector de sucursal y gráficas"
```

---

## Task 13: Botón de análisis en ProductHomeScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/product/screens/ProductHomeScreen.tsx`

- [ ] **Step 1: Agregar import de router y BarChart2**

En `/home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/product/screens/ProductHomeScreen.tsx`, agregar imports:

```ts
import { router } from 'expo-router'
import { Package, Pencil, Power, BarChart2 } from 'lucide-react-native'
```

(reemplaza la línea de import de `lucide-react-native` existente)

- [ ] **Step 2: Agregar botón en columna acciones**

En el `render` de la columna `acciones`, agregar el botón de análisis junto a los existentes:

```tsx
render: (_, row) => (
  <View className='flex flex-row gap-2'>
    <ButtonCustom
      onPress={() => router.push(`/(product-detail)/${row.id}`)}
      bgColor='bg-blue-500'
      icon={BarChart2}
      iconSize={16}
      compact
    />
    <ButtonCustom
      onPress={() => {
        setSelectedProduct(row)
        setModal(true)
      }}
      bgColor='bg-indigo-500'
      icon={Pencil}
      iconSize={18}
      compact
    />
    <ButtonCustom
      onPress={() => { toggleStatus(row.id) }}
      bgColor={`${row.estado ? 'bg-green-500' : 'bg-red-500'}`}
      icon={Power}
      iconSize={18}
      compact
    />
  </View>
)
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd /home/uhernand/interfaz_hormigas && pnpm --filter hormigas_mobile tsc --noEmit 2>&1 | grep -i "error" | head -10
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/product/screens/ProductHomeScreen.tsx
git commit -m "feat(product): agregar botón de análisis en tabla de productos"
```

---

## Task 14: Verificación visual

- [ ] **Step 1: Arrancar app**

```bash
cd /home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile && npx expo start
```

- [ ] **Step 2: Verificar flujo completo**

1. Navegar a tab **Productos**
2. Verificar que la columna Acciones tiene 3 botones (azul, indigo, verde/rojo)
3. Presionar botón azul (BarChart2) en un producto sincronizado → pantalla abre con slide_from_right
4. Verificar header con nombre y SKU del producto
5. Combobox muestra "Todas las sucursales" por defecto
6. Con datos: aparecen cards por sucursal con línea de stock y barras de movimientos
7. TrendBadge muestra % correcto o "Sin datos sem."
8. Seleccionar sucursal específica → filtra a una sola card
9. Presionar un producto NO sincronizado → muestra alerta amber
10. Back button regresa a lista de productos con animación

- [ ] **Step 3: Verificar dark mode**

Activar dark mode → todos los colores de ejes, labels y cards deben adaptarse correctamente.
