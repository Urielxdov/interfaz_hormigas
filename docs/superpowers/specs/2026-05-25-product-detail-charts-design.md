# Diseño: Detalle de Producto con Gráficas por Sucursal

**Fecha:** 2026-05-25
**Librería de gráficas:** react-native-gifted-charts
**Dependencias nuevas:** react-native-gifted-charts (usa react-native-svg ya instalada)

---

## Contexto

Desde la pantalla de productos (`ProductHomeScreen`), al presionar el botón de chart en la columna acciones de un producto, se navega a una pantalla de detalle. Esta pantalla muestra gráficas de stock y movimientos del producto filtradas por sucursal. Los datos vienen del API (`GET /api/movimiento/buscar?productoId=X&sucursalId=Y`).

**Prerequisito:** Producto debe estar sincronizado (tener `server_id`). Productos no sincronizados muestran estado vacío.

---

## Sección 1: Backend

### Archivos modificados

**`/home/uhernand/hormigas/src/main/java/com/example/hormigas/movimiento/dto/MovimientoResponseDTO.java`**

Agregar dos campos al record:
```java
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

**`/home/uhernand/hormigas/src/main/java/com/example/hormigas/movimiento/mapper/MovimientoMapper.java`**

Agregar dos campos al `new MovimientoResponseDTO(...)`:
```java
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
```

**Impacto:** Cambio aditivo al JSON de respuesta. Clientes existentes no se ven afectados.

---

## Sección 2: TypeScript — Tipos y servicio

### `apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts`

Agregar campos a `MovimientoDTO` local:
```ts
export interface MovimientoDTO {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  tipoMovimiento: TipoMovimiento
  cantidad: number
  usuarioNombre: string
  referencia?: string
  fecha: string
  stockAnterior?: number  // nuevo
  stockNuevo?: number     // nuevo
}
```

Agregar `buscarPorProducto` al objeto `_api` dentro de `getMovimientoApi` Y al objeto `api` dentro de `getMovimientoService` (ambas instancias del adapter):
```ts
buscarPorProducto: (productoId: number, sucursalId?: number) => {
  const params = new URLSearchParams({ productoId: String(productoId) })
  if (sucursalId != null) params.set('sucursalId', String(sucursalId))
  return http.get<MovimientoDTO[]>(`/api/movimiento/buscar?${params}`)
},
```

### `packages/application/services/movimiento.service.ts`

Agregar campos opcionales a `MovimientoDTO`:
```ts
export interface MovimientoDTO {
  // ...campos existentes
  stockAnterior?: number
  stockNuevo?: number
}
```

Agregar a `IMovimientoApi`:
```ts
buscarPorProducto(productoId: number, sucursalId?: number): Promise<MovimientoDTO[]>
```

Agregar a `MovimientoSyncService`:
```ts
async buscarPorProducto(productoId: number, sucursalId?: number): Promise<MovimientoDTO[]> {
  return this.api.buscarPorProducto(productoId, sucursalId)
}
```

---

## Sección 3: Navegación y punto de entrada

### Ruta nueva: `app/(product-detail)/_layout.tsx`

Stack con `slide_from_right` 280ms (patrón idéntico a `(branche)/_layout.tsx`):
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

### Ruta nueva: `app/(product-detail)/[localId].tsx`

Wrapper que extrae `localId` de params y renderiza `ProductDetailScreen`.

### Modificación: `ProductHomeScreen.tsx`

Agregar botón con ícono `BarChart2` (lucide-react-native) en la columna `acciones`:
```tsx
import { BarChart2 } from 'lucide-react-native'
import { router } from 'expo-router'

// En la columna acciones, render:
<ButtonCustom
  onPress={() => router.push(`/(product-detail)/${row.id}`)}
  bgColor='bg-blue-500'
  icon={BarChart2}
  iconSize={18}
  compact
/>
```

---

## Sección 4: Componentes de gráficas y pantalla

### `src/product/hooks/useProductDetail.ts`

Hook que encapsula toda la lógica de datos:
- Recibe `localId: string`
- Lookup SQLite → `Product` → `categoriaId` (server_id del producto)
- Si `categoriaId` undefined: retorna `{ notSynced: true }`
- Carga `useBranches()` para lista de sucursales
- `buscarPorProducto(categoriaId, sucursalId?)` según selección de combobox
- Expone:
  - `product: Product | null`
  - `movimientos: MovimientoDTO[]`
  - `branches: Branch[]`
  - `loading: boolean`
  - `notSynced: boolean`
  - `selectedBranchId: number | 'todas'`
  - `setSelectedBranchId`

**Cálculos internos** (memoizados):
- `lineData`: movimientos ordenados ASC por fecha → `{ value: m.stockNuevo, label: formatFecha(m.fecha) }`
- `barData`: agrupa por día → `{ value: sumaEntradas, frontColor: '#059669' }` / `{ value: sumaSalidas, frontColor: '#dc2626' }`
- `trendPercent`: `(movsEstataSemana - movsSemanaPasada) / Math.max(movsSemanaPasada, 1) * 100`

### `src/product/components/StockLineChart.tsx`

Props: `data: { value: number; label?: string }[]`

- `LineChart` de gifted-charts
- Color línea: `#6366f1` (indigo)
- `areaChart`: gradiente `indigo → transparente` bajo la curva
- Puntos: circulares, color indigo, radio 4
- Sin eje X labels si hay > 10 puntos (evita crowding)
- Dark mode: colores de ejes en `#71717a`
- Estado vacío: `Text` centrado "Sin datos de stock"

### `src/product/components/MovimientosBarChart.tsx`

Props: `data: { value: number; label: string; frontColor: string }[]`

- `BarChart` de gifted-charts
- Barras redondeadas (`borderRadius: 4`)
- Entradas: `#059669` (verde), Salidas: `#dc2626` (rojo)
- Labels de fecha en eje X (formato `dd/MM`)
- Spacing uniforme, `barWidth` adaptativo según cantidad de barras
- Estado vacío: `Text` centrado "Sin movimientos"

### `src/product/components/TrendBadge.tsx`

Props: `percent: number | null`

- Pill `rounded-full`, padding horizontal
- `percent > 0`: fondo `bg-green-100`, texto `text-green-700`, ícono `TrendingUp`
- `percent < 0`: fondo `bg-red-100`, texto `text-red-700`, ícono `TrendingDown`
- `percent === 0`: fondo `bg-zinc-100`, texto `text-zinc-500`, ícono `Minus`
- `percent === null`: fondo `bg-zinc-100`, texto `text-zinc-400` "Sin datos"
- Formato: `↑ 12%` / `↓ 5%`

### `src/product/components/BranchProductCard.tsx`

Props: `sucursalNombre`, `movimientos: MovimientoDTO[]`, `lineData`, `barData`, `trendPercent`

Layout:
```
┌── rounded-2xl, shadow, border ───────────────┐
│  Sucursal Centro          [TrendBadge]        │
│  Movimientos: 24  •  Stock actual: 48 uds     │
│                                               │
│  Stock a lo largo del tiempo                  │
│  [StockLineChart]                             │
│                                               │
│  Entradas y salidas                           │
│  [MovimientosBarChart]                        │
└───────────────────────────────────────────────┘
```
- Título sucursal: `font-sans-bold text-zinc-900 dark:text-zinc-50`
- Métricas: `font-sans text-zinc-500 text-sm`
- Separadores entre secciones: `border-t border-stone-100`
- Dark mode completo

### `src/product/screens/ProductDetailScreen.tsx`

- Header propio (back button + nombre del producto)
- Combobox: `SimpleSelect` (reutilizar patrón de `MovimientosScreen`) con opciones `[{ label: 'Todas las sucursales', value: 'todas' }, ...branches.map(...)]`
- Si `notSynced`: card de alerta "Producto no sincronizado — conecta internet y sincroniza para ver datos"
- Si `loading`: `ActivityIndicator`
- Si `selectedBranchId === 'todas'`: `ScrollView` vertical con un `BranchProductCard` por cada sucursal con movimientos
- Si sucursal específica: un solo `BranchProductCard`

### `app/(product-detail)/[localId].tsx`

```tsx
import { useLocalSearchParams } from 'expo-router'
import ProductDetailScreen from '@/src/product/screens/ProductDetailScreen'

export default function ProductDetailPage() {
  const { localId } = useLocalSearchParams<{ localId: string }>()
  return <ProductDetailScreen localId={localId} />
}
```

---

## File Map completo

| Archivo | Acción |
|---|---|
| `hormigas/.../MovimientoResponseDTO.java` | Modificar — agregar `stockAnterior`, `stockNuevo` |
| `hormigas/.../MovimientoMapper.java` | Modificar — mapear los nuevos campos |
| `adapters/movimientoServiceInstance.ts` | Modificar — campos DTO + método `buscarPorProducto` |
| `packages/application/services/movimiento.service.ts` | Modificar — campos DTO + interfaz + método |
| `app/(product-detail)/_layout.tsx` | Crear |
| `app/(product-detail)/[localId].tsx` | Crear |
| `src/product/hooks/useProductDetail.ts` | Crear |
| `src/product/screens/ProductDetailScreen.tsx` | Crear |
| `src/product/components/StockLineChart.tsx` | Crear |
| `src/product/components/MovimientosBarChart.tsx` | Crear |
| `src/product/components/TrendBadge.tsx` | Crear |
| `src/product/components/BranchProductCard.tsx` | Crear |
| `src/product/screens/ProductHomeScreen.tsx` | Modificar — botón chart en acciones |

---

## Dependencias

- `react-native-gifted-charts` — instalar vía `npx expo install react-native-gifted-charts`
- `react-native-svg ~15.12.1` — ya instalada ✓
