# Diseño Responsivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make hormigas_mobile look great on phone (<768px), tablet (768–1023px), and large (≥1024px) screens using a centralized breakpoint hook and responsive maxWidth containers.

**Architecture:** New `useBreakpoint()` hook returns `'phone' | 'tablet' | 'large'`. `useResponsiveValue<T>(phone, tablet, large)` helper picks the right value. `useIsTablet()` becomes a re-export alias (backward compat). All screens get a centered maxWidth wrapper (undefined/700/960). Grids go 1→2 cols on tablet+.

**Tech Stack:** React Native, Expo Router, NativeWind (Tailwind), react-native-reanimated

---

## File Map

| Action | File |
|--------|------|
| Create | `apps/mobile/hormigas_mobile/constants/breakpoints.ts` |
| Create | `apps/mobile/hormigas_mobile/src/utils/hooks/useBreakpoint.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/utils/hooks/useIsTablet.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/home/components/MetricsSection.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/utils/components/DataTable.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/home/screens/HomeScreen.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/product/screens/ProductHomeScreen.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/branches/components/BranchMovimientosSection.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/users/screens/UsuariosScreen.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/product/screens/ProductDetailScreen.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/branches/screens/BranchDetailScreen.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/inventario/screens/InventarioScreen.tsx` |
| Modify | `apps/mobile/hormigas_mobile/src/login/screens/LoginScreen.tsx` |

---

### Task 1: Breakpoints constants + useBreakpoint hook

**Files:**
- Create: `apps/mobile/hormigas_mobile/constants/breakpoints.ts`
- Create: `apps/mobile/hormigas_mobile/src/utils/hooks/useBreakpoint.tsx`
- Modify: `apps/mobile/hormigas_mobile/src/utils/hooks/useIsTablet.tsx`

- [ ] **Step 1: Create breakpoints constants**

```ts
// apps/mobile/hormigas_mobile/constants/breakpoints.ts
export const BREAKPOINTS = {
  tablet: 768,
  large: 1024,
} as const
```

- [ ] **Step 2: Create useBreakpoint hook**

```tsx
// apps/mobile/hormigas_mobile/src/utils/hooks/useBreakpoint.tsx
import { useWindowDimensions } from 'react-native'
import { BREAKPOINTS } from '@/constants/breakpoints'

export type Breakpoint = 'phone' | 'tablet' | 'large'

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions()
  if (width >= BREAKPOINTS.large) return 'large'
  if (width >= BREAKPOINTS.tablet) return 'tablet'
  return 'phone'
}

export function useResponsiveValue<T>(phone: T, tablet: T, large: T): T {
  const bp = useBreakpoint()
  if (bp === 'large') return large
  if (bp === 'tablet') return tablet
  return phone
}
```

- [ ] **Step 3: Replace useIsTablet.tsx with re-export alias**

```tsx
// apps/mobile/hormigas_mobile/src/utils/hooks/useIsTablet.tsx
import { useBreakpoint } from './useBreakpoint'

export default function useIsTablet(): boolean {
  return useBreakpoint() !== 'phone'
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/hormigas_mobile/constants/breakpoints.ts \
        apps/mobile/hormigas_mobile/src/utils/hooks/useBreakpoint.tsx \
        apps/mobile/hormigas_mobile/src/utils/hooks/useIsTablet.tsx
git commit -m "feat(responsive): add useBreakpoint hook with phone/tablet/large breakpoints"
```

---

### Task 2: MetricsSection — 3 columnas en tablet+

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/home/components/MetricsSection.tsx`

Phone: 2 cards en fila (Productos + Sucursales) + Sync abajo. Tablet+: las 3 en una sola fila.

- [ ] **Step 1: Rewrite MetricsSection**

```tsx
// apps/mobile/hormigas_mobile/src/home/components/MetricsSection.tsx
import InformationCard from '@/src/utils/components/InformationCard'
import { useBreakpoint } from '@/src/utils/hooks/useBreakpoint'
import { Building2, Package, RefreshCw } from 'lucide-react-native'
import { View, Text } from 'react-native'

interface MetricsSectionProps {
  totalProductos: number
  totalSucursales: number
  pendienteSync: number
}

export default function MetricsSection({ totalProductos, totalSucursales, pendienteSync }: MetricsSectionProps) {
  const isPhone = useBreakpoint() === 'phone'

  const syncCard = (
    <InformationCard
      title='Pendientes de sync'
      description={pendienteSync > 0 ? `${pendienteSync} movimiento(s)` : 'Todo sincronizado'}
      icon={RefreshCw}
      iconBgColor={pendienteSync > 0 ? 'yellow' : 'green'}
    />
  )

  return (
    <View className='gap-3'>
      <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50 text-base'>Resumen</Text>
      <View className='flex-row gap-3'>
        <View className='flex-1'>
          <InformationCard
            title='Productos'
            description={String(totalProductos)}
            icon={Package}
            iconBgColor='blue'
          />
        </View>
        <View className='flex-1'>
          <InformationCard
            title='Sucursales'
            description={String(totalSucursales)}
            icon={Building2}
            iconBgColor='green'
          />
        </View>
        {!isPhone && <View className='flex-1'>{syncCard}</View>}
      </View>
      {isPhone && syncCard}
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/home/components/MetricsSection.tsx
git commit -m "feat(responsive): MetricsSection 3 cols on tablet+"
```

---

### Task 3: LowStockSection — 2 columnas en tablet+

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx`

- [ ] **Step 1: Rewrite LowStockSection**

```tsx
// apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx
import { ActivityIndicator, View, Text } from 'react-native'
import { AlertTriangle, CheckCircle2 } from 'lucide-react-native'
import { InventarioLocalItem } from '@/src/adapters/inventarioApiInstance'
import { useBreakpoint } from '@/src/utils/hooks/useBreakpoint'

interface LowStockSectionProps {
  items: InventarioLocalItem[]
  loading: boolean
}

export default function LowStockSection({ items, loading }: LowStockSectionProps) {
  const isPhone = useBreakpoint() === 'phone'

  return (
    <View className='bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800 gap-3'>
      <View className='flex-row items-center gap-2'>
        <AlertTriangle size={16} color='#f59e0b' />
        <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>Stock bajo</Text>
      </View>

      {loading && <ActivityIndicator />}

      {!loading && items.length === 0 && (
        <View className='flex-row items-center gap-2 py-2'>
          <CheckCircle2 size={16} color='#22c55e' />
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>Almacenes surtidos</Text>
        </View>
      )}

      {!loading && items.length > 0 && (
        <View style={isPhone ? undefined : { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {items.map(item => (
            <View
              key={`${item.productoId}-${item.sucursalId}`}
              style={isPhone ? undefined : { width: '48%' }}
              className='flex-row items-center justify-between border-b border-stone-50 dark:border-zinc-800 pb-2'
            >
              <View className='flex-1'>
                <Text className='font-sans-medium text-zinc-800 dark:text-zinc-200 text-sm'>
                  {item.productoNombre}
                </Text>
                <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>
                  {item.sucursalNombre}
                </Text>
              </View>
              <View className='bg-red-100 dark:bg-red-900/30 rounded-full px-2 py-0.5'>
                <Text className='font-sans-semibold text-red-700 dark:text-red-400 text-xs'>
                  {item.stockActual} / {item.stockMinimo}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx
git commit -m "feat(responsive): LowStockSection 2-col grid on tablet+"
```

---

### Task 4: DataTable — padding extra en pantallas large

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/DataTable.tsx`

Cambio: importar `useBreakpoint` directo, agregar `isLarge` para `pr-6` en celdas en lugar de `pr-4`.

- [ ] **Step 1: Update DataTable import and cell padding**

Reemplazar la línea:
```tsx
// ANTES:
import useIsTablet from '../hooks/useIsTablet'
```
Por:
```tsx
// DESPUÉS:
import { useBreakpoint } from '../hooks/useBreakpoint'
```

Dentro del componente, reemplazar:
```tsx
// ANTES:
const isTablet = useIsTablet()
```
Por:
```tsx
// DESPUÉS:
const bp = useBreakpoint()
const isTablet = bp !== 'phone'
const isLarge = bp === 'large'
const cellPadding = isLarge ? 'pr-6' : 'pr-4'
```

Reemplazar todas las ocurrencias de `className='pr-4'` en celdas de header y filas:
```tsx
// ANTES (aparece 2 veces — en header y en rows):
className='pr-4'

// DESPUÉS:
className={cellPadding}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/DataTable.tsx
git commit -m "feat(responsive): DataTable larger cell padding on large screens"
```

---

### Task 5: HomeScreen — contenedor maxWidth

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/home/screens/HomeScreen.tsx`

- [ ] **Step 1: Add useResponsiveValue import and replace ScrollView contentContainerStyle**

Agregar al bloque de imports:
```tsx
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
```

Dentro del componente agregar después de los hooks existentes:
```tsx
const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
const padding = useResponsiveValue(16, 24, 32)
```

Reemplazar el `<ScrollView>` y su contenido:
```tsx
// ANTES:
<ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
  <MetricsSection ... />
  <LowStockSection ... />
  <BranchSummaryScreen ... />
</ScrollView>

// DESPUÉS:
<ScrollView>
  <View style={{ maxWidth, alignSelf: 'center', width: '100%', padding, gap: 16 }}>
    <MetricsSection ... />
    <LowStockSection ... />
    <BranchSummaryScreen ... />
  </View>
</ScrollView>
```

Agregar `View` a los imports de react-native si no está (ya está en el archivo).

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/home/screens/HomeScreen.tsx
git commit -m "feat(responsive): HomeScreen maxWidth centered container"
```

---

### Task 6: ProductHomeScreen — contenedor maxWidth

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/product/screens/ProductHomeScreen.tsx`

La pantalla actualmente no tiene `ScrollView` externo — el `View` `w-11/12 self-center` queda fijo. Se agrega un `ScrollView` externo con el contenedor `maxWidth`.

- [ ] **Step 1: Add ScrollView wrapper with maxWidth container**

Agregar imports:
```tsx
import { ScrollView, Text, View } from 'react-native'
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
```

(Agregar `ScrollView` al import de react-native — actualmente solo tiene `Text, View`.)

Dentro del componente agregar:
```tsx
const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
const paddingH = useResponsiveValue(16, 24, 32)
```

Reemplazar la estructura del return. El `<View className='flex-1 bg-stone-50...'>` externo se mantiene. El `<View className='w-11/12 self-center gap-2 pt-4'>` interior y el `<Modal>` cambian:

```tsx
// ANTES:
return (
  <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
    <View className='w-11/12 self-center gap-2 pt-4'>
      {/* ... todo el contenido ... */}
    </View>

    <Modal isOpen={modal} onClose={() => setModal(false)}>
      {/* ... */}
    </Modal>
  </View>
)

// DESPUÉS:
return (
  <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
    <ScrollView>
      <View style={{ maxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: paddingH, paddingTop: 16, gap: 8 }}>
        {/* ... todo el contenido sin cambios ... */}
      </View>
    </ScrollView>

    <Modal isOpen={modal} onClose={() => setModal(false)}>
      {/* ... sin cambios ... */}
    </Modal>
  </View>
)
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/product/screens/ProductHomeScreen.tsx
git commit -m "feat(responsive): ProductHomeScreen maxWidth centered container"
```

---

### Task 7: BranchesScreen — contenedor maxWidth

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx`

- [ ] **Step 1: Add maxWidth container to BranchesScreen**

Agregar import:
```tsx
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
```

Dentro del componente agregar:
```tsx
const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
const padding = useResponsiveValue(16, 24, 32)
```

Reemplazar el `<ScrollView>`:
```tsx
// ANTES:
<ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
  {/* Header */}
  ...
  <DataTable ... />
  <BranchMovimientosSection ... />
</ScrollView>

// DESPUÉS:
<ScrollView>
  <View style={{ maxWidth, alignSelf: 'center', width: '100%', padding, gap: 16 }}>
    {/* Header — sin cambios */}
    ...
    <DataTable ... />
    <BranchMovimientosSection ... />
  </View>
</ScrollView>
```

Agregar `View` al import de react-native (ya está, junto con `ScrollView, Text, TouchableOpacity, View`).

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx
git commit -m "feat(responsive): BranchesScreen maxWidth centered container"
```

---

### Task 8: BranchMovimientosSection — 2-col cards en tablet+

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/branches/components/BranchMovimientosSection.tsx`

- [ ] **Step 1: Rewrite BranchMovimientosSection**

```tsx
// apps/mobile/hormigas_mobile/src/branches/components/BranchMovimientosSection.tsx
import { useMovimientos } from '@/src/movimientos/hooks/useMovimientos'
import { useBreakpoint } from '@/src/utils/hooks/useBreakpoint'
import { BranchItemListDTO } from '@hormigas/application'
import { router } from 'expo-router'
import { Activity, Eye, TrendingDown, TrendingUp } from 'lucide-react-native'
import { useMemo } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  branches: BranchItemListDTO[]
}

export default function BranchMovimientosSection({ branches }: Props) {
  const { movimientos, loading } = useMovimientos()
  const isPhone = useBreakpoint() === 'phone'

  const statsBySucursal = useMemo(() => {
    const map: Record<number, { entradas: number; salidas: number; total: number }> = {}
    for (const m of movimientos) {
      if (!map[m.sucursalId]) map[m.sucursalId] = { entradas: 0, salidas: 0, total: 0 }
      map[m.sucursalId].total++
      if (m.tipoMovimiento === 'ENTRADA') map[m.sucursalId].entradas++
      else map[m.sucursalId].salidas++
    }
    return map
  }, [movimientos])

  return (
    <View className='gap-3'>
      <View className='flex-row items-center gap-2 px-1'>
        <Activity size={18} color='#6366f1' />
        <Text className='font-sans-bold text-zinc-900 dark:text-zinc-50 text-base'>Actividad por sucursal</Text>
        {loading && <ActivityIndicator size='small' color='#6366f1' />}
      </View>

      {branches.length === 0 && !loading && (
        <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-center py-4 text-sm'>
          Sin sucursales registradas
        </Text>
      )}

      <View style={isPhone ? undefined : { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {branches.map(branch => {
          const id = Number(branch.id)
          const stats = statsBySucursal[id] ?? { entradas: 0, salidas: 0, total: 0 }
          return (
            <View
              key={String(branch.id)}
              style={isPhone ? { marginBottom: 12 } : { width: '48%' }}
              className='bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 overflow-hidden'
            >
              <View className='flex-row items-center justify-between px-4 pt-4 pb-3'>
                <View className='flex-1 gap-0.5'>
                  <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>{branch.nombre}</Text>
                  <View className='flex-row items-center gap-1.5'>
                    <View className={`w-1.5 h-1.5 rounded-full ${branch.activa ? 'bg-green-500' : 'bg-zinc-400'}`} />
                    <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>
                      {branch.activa ? 'Activa' : 'Inactiva'}
                      {branch.responsable ? ` · ${branch.responsable}` : ''}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(branche)/[sucursalId]/detalle',
                      params: { sucursalId: String(branch.id), sucursalNombre: branch.nombre },
                    })
                  }
                  className='p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl'
                >
                  <Eye size={18} color='#6366f1' />
                </TouchableOpacity>
              </View>

              <View className='flex-row border-t border-stone-50 dark:border-zinc-800'>
                <View className='flex-1 items-center py-3 gap-0.5 border-r border-stone-50 dark:border-zinc-800'>
                  <TrendingUp size={13} color='#059669' />
                  <Text className='font-sans-bold text-green-700 dark:text-green-400 text-lg leading-tight'>
                    {stats.entradas}
                  </Text>
                  <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>Entradas</Text>
                </View>
                <View className='flex-1 items-center py-3 gap-0.5 border-r border-stone-50 dark:border-zinc-800'>
                  <TrendingDown size={13} color='#dc2626' />
                  <Text className='font-sans-bold text-red-700 dark:text-red-400 text-lg leading-tight'>
                    {stats.salidas}
                  </Text>
                  <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>Salidas</Text>
                </View>
                <View className='flex-1 items-center py-3 gap-0.5'>
                  <Activity size={13} color='#6366f1' />
                  <Text className='font-sans-bold text-zinc-700 dark:text-zinc-300 text-lg leading-tight'>
                    {stats.total}
                  </Text>
                  <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs'>Total</Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/branches/components/BranchMovimientosSection.tsx
git commit -m "feat(responsive): BranchMovimientosSection 2-col cards on tablet+"
```

---

### Task 9: MovimientosScreen — contenedor maxWidth

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx`

El único cambio estructural es reemplazar `<View className='w-11/12 self-center mt-4 gap-3'>` por un contenedor con `maxWidth` responsivo.

- [ ] **Step 1: Add useResponsiveValue and replace wrapper View**

Agregar al bloque de imports (no romper los imports existentes):
```tsx
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
```

Dentro de `MovimientosScreen` (después de todos los hooks existentes, antes del return):
```tsx
const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
const paddingH = useResponsiveValue(16, 24, 32)
```

Reemplazar la línea:
```tsx
// ANTES:
<View className='w-11/12 self-center mt-4 gap-3'>

// DESPUÉS:
<View style={{ maxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: paddingH }} className='flex-1 mt-4 gap-3'>
```

El cierre `</View>` correspondiente y todo el contenido interior (SimpleSelect, ScrollView con cards de movimiento) no cambian.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx
git commit -m "feat(responsive): MovimientosScreen maxWidth centered container"
```

---

### Task 10: UsuariosScreen — maxWidth + 2-col user cards

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/users/screens/UsuariosScreen.tsx`

- [ ] **Step 1: Add responsive container and 2-col user grid**

Agregar imports:
```tsx
import { useBreakpoint, useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
```

Dentro del componente agregar:
```tsx
const isPhone = useBreakpoint() === 'phone'
const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
const paddingH = useResponsiveValue(16, 24, 32)
```

Reemplazar la línea del wrapper:
```tsx
// ANTES:
<View className='w-11/12 self-center mt-4 gap-2'>

// DESPUÉS:
<View style={{ maxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: paddingH }} className='flex-1 mt-4 gap-2'>
```

Reemplazar el `<ScrollView>` y sus items:
```tsx
// ANTES:
<ScrollView className='mt-2' showsVerticalScrollIndicator={false}>
  {usuarios.map(u => (
    <View
      key={u.id}
      className='bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-3 border border-stone-100 dark:border-zinc-800'
    >
      {/* ... card content ... */}
    </View>
  ))}
</ScrollView>

// DESPUÉS:
<ScrollView className='mt-2' showsVerticalScrollIndicator={false}>
  <View style={isPhone ? { gap: 12 } : { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
    {usuarios.map(u => (
      <View
        key={u.id}
        style={isPhone ? undefined : { width: '48%' }}
        className='bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-100 dark:border-zinc-800'
      >
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center gap-2'>
            <Users size={18} color='#6366f1' />
            <Text className='font-sans-semibold text-base text-zinc-900 dark:text-zinc-50'>{u.name}</Text>
          </View>
          <Text className={statusClass(u.activo ? 'green' : 'gray')}>
            {u.activo ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
        <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm mt-1'>{u.correo}</Text>
        {u.sucursalId && (
          <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-xs mt-1'>Sucursal ID: {u.sucursalId}</Text>
        )}
      </View>
    ))}
  </View>
</ScrollView>
```

El `<Modal>` nativo al final del archivo no cambia.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/users/screens/UsuariosScreen.tsx
git commit -m "feat(responsive): UsuariosScreen maxWidth + 2-col user cards on tablet+"
```

---

### Task 11: ProductDetailScreen — maxWidth + 2-col branch cards

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/product/screens/ProductDetailScreen.tsx`

- [ ] **Step 1: Add responsive container and 2-col BranchProductCards**

Agregar imports:
```tsx
import { useBreakpoint, useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
```

Dentro del componente (después de los hooks existentes):
```tsx
const isPhone = useBreakpoint() === 'phone'
const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
const padding = useResponsiveValue(16, 24, 32)
```

Reemplazar el `<ScrollView>` completo:
```tsx
// ANTES:
<ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
  {/* ... notSynced, no connection, SelectField, loading, empty state ... */}
  {!loading && selectedBranchId === 'todas' &&
    branchGroups.map(({ branch, movimientos: branchMovs }) => (
      <BranchProductCard
        key={String(branch.id)}
        sucursalNombre={branch.nombre}
        movimientos={branchMovs}
      />
    ))}
  {/* ... single branch view ... */}
</ScrollView>

// DESPUÉS:
<ScrollView>
  <View style={{ maxWidth, alignSelf: 'center', width: '100%', padding, gap: 12 }}>
    {/* notSynced, no connection, SelectField, loading, empty state — sin cambios */}
    {notSynced && ( ... )}
    {!isOnline && !notSynced && ( ... )}
    {!notSynced && ( <SelectField ... /> )}
    {loading && ( <ActivityIndicator ... /> )}
    {!loading && !notSynced && movimientos.length === 0 && isOnline && ( <Text ... /> )}

    {/* Vista "todas" — 2 cols en tablet+ */}
    {!loading && selectedBranchId === 'todas' && (
      <View style={isPhone ? { gap: 12 } : { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {branchGroups.map(({ branch, movimientos: branchMovs }) => (
          <View
            key={String(branch.id)}
            style={isPhone ? undefined : { width: '48%' }}
          >
            <BranchProductCard
              sucursalNombre={branch.nombre}
              movimientos={branchMovs}
            />
          </View>
        ))}
      </View>
    )}

    {/* Vista sucursal específica — sin cambios */}
    {!loading && selectedBranchId !== 'todas' && movimientos.length > 0 && (
      <BranchProductCard
        sucursalNombre={
          branches.find(b => Number(b.id) === selectedBranchId)?.nombre ?? ''
        }
        movimientos={movimientos}
      />
    )}
  </View>
</ScrollView>
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/product/screens/ProductDetailScreen.tsx
git commit -m "feat(responsive): ProductDetailScreen maxWidth + 2-col branch cards on tablet+"
```

---

### Task 12: BranchDetailScreen — contenedor maxWidth

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/branches/screens/BranchDetailScreen.tsx`

- [ ] **Step 1: Add maxWidth container**

Agregar import:
```tsx
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
```

Dentro del componente (después de los hooks existentes):
```tsx
const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
const padding = useResponsiveValue(16, 24, 32)
```

Reemplazar el `<ScrollView>`:
```tsx
// ANTES:
<ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
  {/* Stats, LowStock, Movements, Inventory sections */}
</ScrollView>

// DESPUÉS:
<ScrollView>
  <View style={{ maxWidth, alignSelf: 'center', width: '100%', padding, gap: 16 }}>
    {/* Stats, LowStock, Movements, Inventory sections — sin cambios */}
  </View>
</ScrollView>
```

`View` ya está en los imports de react-native en este archivo.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/branches/screens/BranchDetailScreen.tsx
git commit -m "feat(responsive): BranchDetailScreen maxWidth centered container"
```

---

### Task 13: InventarioScreen — maxWidth + 2-col FlatList

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/inventario/screens/InventarioScreen.tsx`

`FlatList` con `numColumns` requiere cambiar `key` cuando cambia el número de columnas; de lo contrario RN lanza un error en runtime.

- [ ] **Step 1: Add responsive container and numColumns**

Agregar import:
```tsx
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
```

Dentro del componente (después de los hooks existentes):
```tsx
const numColumns = useResponsiveValue(1, 2, 2)
const padding = useResponsiveValue(16, 24, 32)
const maxWidth = useResponsiveValue<number | undefined>(undefined, 700, 960)
```

El header (`<View className="bg-white ... flex-row items-center justify-between">`) permanece full-width. Solo el `<FlatList>` se envuelve en el contenedor `maxWidth`:

```tsx
// ANTES:
<FlatList
  data={items}
  keyExtractor={i => String(i.id)}
  contentContainerStyle={{ padding: 16, gap: 8 }}
  onRefresh={refresh}
  refreshing={loading}
  ListEmptyComponent={...}
  renderItem={({ item }) => (
    <View className="bg-white dark:bg-zinc-900 rounded-xl border border-stone-200 dark:border-zinc-800 p-4 gap-3">
      {/* ... */}
    </View>
  )}
/>

// DESPUÉS:
<View style={{ flex: 1, maxWidth, alignSelf: 'center', width: '100%' }}>
  <FlatList
    key={String(numColumns)}
    data={items}
    keyExtractor={i => String(i.id)}
    numColumns={numColumns}
    contentContainerStyle={{ padding, gap: 8 }}
    columnWrapperStyle={numColumns > 1 ? { gap: 8 } : undefined}
    onRefresh={refresh}
    refreshing={loading}
    ListEmptyComponent={
      <View className="items-center py-16 gap-2">
        <Package size={48} color="#a8a29e" />
        <Text className="text-stone-400">Sin productos en esta sucursal</Text>
      </View>
    }
    renderItem={({ item }) => (
      <View
        style={numColumns > 1 ? { flex: 1 } : undefined}
        className="bg-white dark:bg-zinc-900 rounded-xl border border-stone-200 dark:border-zinc-800 p-4 gap-3"
      >
        {/* contenido del item sin cambios */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="font-sans-semibold text-zinc-900 dark:text-zinc-50">{item.productoNombre}</Text>
            {item.precio != null && (
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">${item.precio.toFixed(2)}</Text>
            )}
          </View>
          <StockBadge item={item} />
        </View>

        <View className="flex-row gap-2 justify-around">
          <View className="items-center">
            <Text className="text-xs text-zinc-400">Actual</Text>
            <Text className="font-sans-bold text-lg text-zinc-900 dark:text-zinc-50">{item.stockActual}</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs text-zinc-400">Mín</Text>
            <Text className="text-lg text-zinc-700 dark:text-zinc-300">{item.stockMinimo}</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs text-zinc-400">Máx</Text>
            <Text className="text-lg text-zinc-700 dark:text-zinc-300">{item.stockMaximo}</Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => goToMovimiento(item, 'SALIDA')}
            className="flex-1 bg-red-500 rounded-lg py-2 items-center"
          >
            <Text className="text-white font-sans-semibold">Venta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goToMovimiento(item, 'ENTRADA')}
            className="flex-1 bg-green-600 rounded-lg py-2 items-center"
          >
            <Text className="text-white font-sans-semibold">Compra</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goToMovimiento(item)}
            className="flex-1 bg-stone-100 dark:bg-zinc-800 rounded-lg py-2 items-center"
          >
            <Text className="text-zinc-700 dark:text-zinc-300 font-sans-semibold">Otro</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}
  />
</View>
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/inventario/screens/InventarioScreen.tsx
git commit -m "feat(responsive): InventarioScreen maxWidth + 2-col FlatList on tablet+"
```

---

### Task 14: LoginScreen — card centrado en tablet+

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/login/screens/LoginScreen.tsx`

- [ ] **Step 1: Constrain login card width on tablet+**

Agregar import:
```tsx
import { useResponsiveValue } from '@/src/utils/hooks/useBreakpoint'
```

Dentro del componente:
```tsx
const cardMaxWidth = useResponsiveValue<number | undefined>(undefined, 440, 440)
```

Reemplazar la línea del card wrapper:
```tsx
// ANTES:
<View className='w-11/12 self-center rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm'>

// DESPUÉS:
<View
  style={{ width: '91.67%', maxWidth: cardMaxWidth }}
  className='self-center rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm'
>
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/login/screens/LoginScreen.tsx
git commit -m "feat(responsive): LoginScreen constrain card width on tablet+"
```
