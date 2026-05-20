# Movimientos — Searchable Product Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw `productoId` TextInput in MovimientosScreen with a searchable combobox that loads real products and lets the user filter by name or SKU.

**Architecture:** A new generic `SearchableSelect` component handles its own modal + search state and is dropped in place of the existing TextInput. `MovimientosScreen` wires it up via `useProducts()`, mapping `ProductViewModel[]` to `{label, sublabel, value}[]`. No changes to form state shape or submit logic.

**Tech Stack:** React Native, NativeWind (Tailwind classes), lucide-react-native icons, existing `useProducts` hook.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `apps/mobile/hormigas_mobile/src/utils/components/SearchableSelect.tsx` | Generic searchable bottom-sheet selector |
| Modify | `apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx` | Wire products + replace TextInput |

---

### Task 1: Create `SearchableSelect` component

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/utils/components/SearchableSelect.tsx`

- [ ] **Step 1: Create the component file**

Create `apps/mobile/hormigas_mobile/src/utils/components/SearchableSelect.tsx` with the following content:

```tsx
import { useState } from 'react'
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { ChevronDown, Search, X } from 'lucide-react-native'

export interface SearchableSelectOption<T> {
  label: string
  sublabel?: string
  value: T
}

interface Props<T extends string | number> {
  label: string
  value: T | ''
  options: SearchableSelectOption<T>[]
  onChange: (v: T) => void
  placeholder?: string
}

export function SearchableSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find(o => o.value === value)

  const filtered = query.trim() === ''
    ? options
    : options.filter(o => {
        const q = query.toLowerCase()
        return (
          o.label.toLowerCase().includes(q) ||
          (o.sublabel?.toLowerCase().includes(q) ?? false)
        )
      })

  const handleClose = () => {
    setOpen(false)
    setQuery('')
  }

  const handleSelect = (v: T) => {
    onChange(v)
    handleClose()
  }

  return (
    <View className='gap-1'>
      <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>

      <TouchableOpacity
        className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3.5 py-3 flex-row items-center justify-between bg-white dark:bg-zinc-800'
        onPress={() => setOpen(true)}
      >
        <Text className={`font-sans ${selected ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`}>
          {selected
            ? `${selected.label}${selected.sublabel ? ` — ${selected.sublabel}` : ''}`
            : placeholder ?? 'Seleccionar...'}
        </Text>
        <ChevronDown size={14} color='#a1a1aa' />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType='slide' onRequestClose={handleClose}>
        <Pressable className='flex-1 bg-black/60 justify-end' onPress={handleClose}>
          <Pressable onPress={() => {}}>
            <View className='bg-white dark:bg-zinc-900 rounded-t-2xl max-h-96'>
              <View className='flex-row items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-zinc-800'>
                <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50'>{label}</Text>
                <TouchableOpacity onPress={handleClose}>
                  <X size={18} color='#71717a' />
                </TouchableOpacity>
              </View>

              <View className='px-4 py-2 border-b border-stone-100 dark:border-zinc-800'>
                <View className='flex-row items-center gap-2 border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-2 bg-stone-50 dark:bg-zinc-800'>
                  <Search size={14} color='#a1a1aa' />
                  <TextInput
                    autoFocus
                    value={query}
                    onChangeText={setQuery}
                    placeholder='Buscar...'
                    placeholderTextColor='#a1a1aa'
                    className='flex-1 font-sans text-zinc-900 dark:text-zinc-50 text-sm'
                  />
                </View>
              </View>

              {filtered.length === 0 ? (
                <View className='px-4 py-8 items-center'>
                  <Text className='font-sans text-zinc-400 dark:text-zinc-500 text-sm'>Sin productos disponibles</Text>
                </View>
              ) : (
                <FlatList
                  data={filtered}
                  keyExtractor={item => String(item.value)}
                  keyboardShouldPersistTaps='handled'
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className={`px-4 py-3 border-b border-stone-50 dark:border-zinc-800 ${item.value === value ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                      onPress={() => handleSelect(item.value)}
                    >
                      <Text className={`font-sans-medium text-sm ${item.value === value ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {item.label}
                      </Text>
                      {item.sublabel && (
                        <Text className='font-sans text-xs text-zinc-400 dark:text-zinc-500 mt-0.5'>
                          SKU: {item.sublabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
```

- [ ] **Step 2: Commit the new component**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/SearchableSelect.tsx
git commit -m "feat(ui): add SearchableSelect component with bottom-sheet and filter"
```

---

### Task 2: Integrate `SearchableSelect` in `MovimientosScreen`

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx`

- [ ] **Step 1: Add imports at the top of `MovimientosScreen.tsx`**

After the existing imports block (after line 16), add:

```tsx
import { useProducts } from '@/src/utils/hooks/useProducts'
import { SearchableSelect } from '@/src/utils/components/SearchableSelect'
```

- [ ] **Step 2: Add `useProducts` call inside `MovimientosScreen`**

Inside `MovimientosScreen` function, after line 100 (after `const { movimientos, loading, error, creating, registrar, recargar } = useMovimientos(filterSucursalId)`), add:

```tsx
const { products } = useProducts()

const productOptions = products.map(p => ({
  label: p.nombre,
  sublabel: p.sku,
  value: p.id,
}))
```

- [ ] **Step 3: Replace the `TextInput` block for "ID Producto"**

Find this block in the modal (lines 221–231):

```tsx
<View className='gap-1'>
  <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>ID Producto</Text>
  <TextInput
    className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800 font-sans'
    value={form.productoId}
    onChangeText={v => setForm(p => ({ ...p, productoId: v }))}
    keyboardType='numeric'
    placeholder='Ej. 1'
    placeholderTextColor='#a1a1aa'
  />
</View>
```

Replace it with:

```tsx
<SearchableSelect
  label='Producto'
  placeholder='Buscar producto...'
  options={productOptions}
  value={form.productoId}
  onChange={v => setForm(p => ({ ...p, productoId: String(v) }))}
/>
```

- [ ] **Step 4: Verify the screen compiles — run the dev server**

```bash
cd apps/mobile/hormigas_mobile && npx expo start
```

Open the app, tap "Registrar", verify:
- The "Producto" field shows the placeholder
- Tapping opens the bottom-sheet modal
- Typing filters products by name and SKU
- Selecting a product closes the modal and shows `nombre — sku` in the field
- "Registrar movimiento" submits correctly with the selected product UUID

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx
git commit -m "feat(movimientos): replace productoId input with SearchableSelect"
```
