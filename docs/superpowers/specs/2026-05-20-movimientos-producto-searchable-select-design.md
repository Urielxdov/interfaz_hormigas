# Design: Searchable Product Selector in MovimientosScreen

**Date:** 2026-05-20  
**Scope:** Replace the `productoId` TextInput in MovimientosScreen with a searchable combobox backed by real product data.

---

## Problem

The "Nuevo movimiento" modal asks the user to type a raw numeric product ID. This is error-prone and requires the user to know the ID beforehand.

## Solution

A new `SearchableSelect` component that opens a bottom-sheet modal with a search field and filtered product list.

---

## Component: `SearchableSelect`

**File:** `apps/mobile/hormigas_mobile/src/utils/components/SearchableSelect.tsx`

### Props

```ts
interface SearchableSelectOption<T> {
  label: string
  sublabel?: string
  value: T
}

interface SearchableSelectProps<T extends string | number> {
  label: string
  value: T | ''
  options: SearchableSelectOption<T>[]
  onChange: (v: T) => void
  placeholder?: string
}
```

### Behavior

- **Trigger field:** Same visual style as `SimpleSelect` (border, rounded-xl, bg-white/zinc-800). Shows `label — sublabel` of selected item, or placeholder when empty.
- **Modal:** `animationType='slide'` bottom-sheet with:
  - Header: label title + X close button
  - Search input: autofocused `TextInput` with `Search` icon (lucide-react-native), resets to `''` on close
  - `FlatList`: filters options by `label` and `sublabel` (case-insensitive, combined). Shows all when query is empty.
  - Each item: `nombre` in primary text + `SKU: xxx` in zinc-400 secondary text
  - Selected item highlighted in indigo (bg-indigo-50/dark:bg-indigo-900/30, text-indigo-600)
  - Empty state: "Sin productos disponibles" when list is empty

### Internal state

- `open: boolean` — controls modal visibility
- `query: string` — search text, reset to `''` on close

---

## Integration: `MovimientosScreen`

**File:** `apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx`

### Changes

1. Import `useProducts` from `@/src/utils/hooks/useProducts`
2. Import `SearchableSelect` from `@/src/utils/components/SearchableSelect`
3. Build product options:
   ```ts
   const productOptions = products.map(p => ({
     label: p.nombre,
     sublabel: p.sku,
     value: p.id,
   }))
   ```
4. Replace `TextInput` block for "ID Producto" with:
   ```tsx
   <SearchableSelect
     label='Producto'
     placeholder='Buscar producto...'
     options={productOptions}
     value={form.productoId}
     onChange={v => setForm(p => ({ ...p, productoId: String(v) }))}
   />
   ```

### No-change surfaces

- `FormState.productoId` stays `string` (UUID)
- `handleRegistrar` validation (`!form.productoId`) unchanged
- `EMPTY_FORM.productoId = ''` resets selector to placeholder automatically

---

## Data flow

```
useProducts() → ProductViewModel[] → productOptions → SearchableSelect → form.productoId (UUID)
```

Products load from local SQLite on mount (offline-first, same as branches). No pagination needed — full list fits in memory.

---

## Out of scope

- Pagination or lazy loading of products
- Creating a new product from within the movimiento modal
- Filtering products by branch
