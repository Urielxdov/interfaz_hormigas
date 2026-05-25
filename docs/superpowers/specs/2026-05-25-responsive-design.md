# Responsive Design — hormigas_mobile

**Fecha:** 2026-05-25  
**Estado:** Aprobado

## Objetivo

Hacer que la app se vea bien en celulares, tabletas y pantallas grandes. Mobile-first: si se ve bien en phone, en tablet y large solo se ajustan proporciones, columnas y espaciado.

---

## Sistema base

### Breakpoints (`constants/breakpoints.ts`)

| Nombre   | Rango         |
|----------|---------------|
| `phone`  | < 768         |
| `tablet` | 768 – 1023   |
| `large`  | ≥ 1024        |

### Hooks (`src/utils/hooks/useBreakpoint.tsx`)

```ts
type Breakpoint = 'phone' | 'tablet' | 'large'

function useBreakpoint(): Breakpoint
function useResponsiveValue<T>(phone: T, tablet: T, large: T): T
function useIsTablet(): boolean  // alias backward compat: breakpoint !== 'phone'
```

`useIsTablet` se mantiene como alias para no romper `DataTable` existente. Archivo `useIsTablet.tsx` se reemplaza con re-export a `useBreakpoint`.

### Contenedor responsivo — patrón estándar

Todas las pantallas envuelven su contenido en un contenedor centrado con `maxWidth`:

| Breakpoint | maxWidth | padding horizontal |
|------------|----------|--------------------|
| phone      | sin límite | 16               |
| tablet     | 700      | 24                 |
| large      | 960      | 32                 |

Implementado como valores devueltos por `useResponsiveValue` en cada pantalla, NO como componente nuevo (YAGNI).

---

## Componentes compartidos

### MetricsSection

- **phone:** 2 cards en fila (Productos, Sucursales) + card de sync abajo — layout actual
- **tablet / large:** 3 cards en fila (Productos, Sucursales, Sync) — una fila completa

### LowStockSection

- **phone:** lista vertical, un ítem por fila
- **tablet+:** grid 2 columnas con `flex-wrap`

### DataTable

- **phone:** scroll horizontal activado
- **tablet:** scroll horizontal desactivado (ya implementado)
- **large:** scroll horizontal desactivado, padding de celdas aumenta de `pr-4` a `pr-6`

### Modal

- **phone:** full-screen desde abajo (comportamiento actual con `bottom-sheet` feel)
- **tablet+:** card centrado, `maxWidth: 560`, `borderRadius: 20`, overlay oscuro detrás

### InformationCard

Sin cambios estructurales — hereda espaciado del contenedor padre.

---

## Pantallas principales (tabs)

### HomeScreen

- Contenedor `maxWidth` centrado en tablet/large
- `MetricsSection` y `LowStockSection` heredan cambios de sus componentes
- `BranchSummaryScreen` (DataTable) hereda cambios de DataTable

### ProductHomeScreen

- Contenedor `maxWidth` centrado
- Header stack→row en tablet+ (ya existe, se mantiene)
- `InformationCard` de stock total: sin cambio estructural
- `DataTable` hereda cambios

### BranchesScreen

- Contenedor `maxWidth` centrado
- Header stack→row en tablet+ (ya existe, se mantiene)
- `BranchMovimientosSection`: cards en 1 col phone → 2 cols tablet → 3 cols large usando `numColumns` en FlatList o `flex-wrap`

### MovimientosScreen

- Contenedor `maxWidth` centrado
- Header stack→row en tablet+

### UsuariosScreen

- Contenedor `maxWidth` centrado
- Header stack→row en tablet+

---

## Sub-pantallas

### ProductDetailScreen

- Contenedor `maxWidth` centrado
- `BranchProductCard` items: 1 col phone → 2 cols tablet+ con `flex-wrap`

### BranchDetailScreen / InventarioScreen / MovimientoScreen (sucursal)

- Contenedor `maxWidth` centrado
- Header stack→row en tablet+

---

## LoginScreen

- **phone:** full screen, sin cambios
- **tablet+:** card centrado `maxWidth: 440`, shadow suave, sobre fondo `bg-stone-50 dark:bg-zinc-950`, espaciado vertical automático con `justifyContent: center`

---

## Orden de implementación

1. `constants/breakpoints.ts` — definir valores
2. `useBreakpoint.tsx` — hook + helpers
3. `useIsTablet.tsx` — re-export alias
4. `Modal` — responsive
5. `MetricsSection` — 3 cols tablet+
6. `LowStockSection` — 2 cols tablet+
7. `DataTable` — large padding
8. Todas las pantallas tabs — contenedor + header responsive
9. Sub-pantallas — contenedor + layout responsive
10. `LoginScreen` — card centrado tablet+

---

## Lo que NO cambia

- Lógica de negocio, hooks de datos, adapters
- Animaciones existentes (FadeIn, FadeInDown, slide_from_right)
- Dark mode — funciona igual en todos los breakpoints
- Breakpoints de `DataTable` existentes (tablet ≥ 768)
