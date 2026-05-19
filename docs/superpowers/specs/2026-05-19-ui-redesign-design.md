# UI Redesign — Hormigas Mobile

**Date:** 2026-05-19  
**Scope:** Style, typography, color only. Zero logic changes.  
**Stack:** Expo 54, NativeWind 4.2.3, React Native 0.81

---

## Goal

Calm, professional inventory management aesthetic. Warm gray default with dark mode toggle (Moon/Sun icon in header). Indigo accent. Tablet-first, adaptive for phone.

---

## Theme System

**Approach:** NativeWind `setColorScheme` (Approach A).

- `setColorScheme('dark' | 'light')` from `nativewind`
- Toggle in `HomeScreen` header (Moon/Sun icon from lucide)
- Persist preference to AsyncStorage on toggle
- All components add `dark:` prefixes to className

**ThemeToggle component** (`src/utils/components/ThemeToggle.tsx`):
- Reads `useColorScheme()` from `nativewind`
- Renders `Sun` icon when dark, `Moon` when light
- On press: reads current scheme, flips it, saves to AsyncStorage key `@theme`
- On app start: `_layout.tsx` reads AsyncStorage, calls `setColorScheme` before render

---

## Color Palette

### Light (default)
| Token | Tailwind | Hex |
|-------|----------|-----|
| Background | `stone-50` | #FAFAF9 |
| Surface/Card | `white` | #FFFFFF |
| Border | `stone-200` | #E7E5E4 |
| Text primary | `zinc-900` | #18181B |
| Text secondary | `zinc-500` | #71717A |
| Text muted | `zinc-400` | #A1A1AA |
| Accent | `indigo-500` | #6366F1 |
| Accent bg | `indigo-50` | #EEF2FF |
| Success | `emerald-500` | #10B981 |
| Warning | `amber-500` | #F59E0B |
| Danger | `red-500` | #EF4444 |

### Dark
| Token | Tailwind | Hex |
|-------|----------|-----|
| Background | `zinc-950` | #09090B |
| Surface/Card | `zinc-900` | #18181B |
| Border | `zinc-800` | #27272A |
| Text primary | `zinc-50` | #FAFAFA |
| Text secondary | `zinc-400` | #A1A1AA |
| Text muted | `zinc-600` | #52525B |
| Accent | `indigo-400` | #818CF8 |

Status badge colors (emerald/amber/red/blue/orange) unchanged — semantically correct in both modes.

---

## Typography

**Font:** Inter via `@expo-google-fonts/inter`  
**Weights loaded:** 400, 500, 600, 700

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| display | 32px / `text-3xl` | bold | Screen titles (tablet) |
| h1 | 24px / `text-2xl` | bold | Section headers |
| h2 | 20px / `text-xl` | semibold | Subtitles |
| h3 | 16px / `text-base` | semibold | Card labels |
| body | 14px / `text-sm` | normal | Table content, lists |
| caption | 12px / `text-xs` | normal | Metadata, timestamps |
| label | 12px / `text-xs` | medium | Form labels |

Registered as `fontFamily` default in `tailwind.config.js`. Existing Tailwind text/font classes continue to work unchanged.

---

## Component Changes

### `ButtonCustom`
- Default `bgColor`: `bg-indigo-500` (was `bg-blue-500`)
- Border radius: `rounded-xl` (was `rounded-lg`)
- Text size: `text-base font-semibold` (was `text-lg font-bold`)
- Add `dark:` variants per bgColor where needed
- Add `active:opacity-80` for press feedback

### `DataTable`
- Container: `bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800`
- Header icon: `color="#6366f1"` (was hardcoded `'green'`)
- Column header text: `text-zinc-500 dark:text-zinc-400 uppercase text-xs font-semibold`
- Row alternating: even rows get `bg-stone-50 dark:bg-zinc-800/50`
- Row border: `border-stone-100 dark:border-zinc-800`
- Cell text: `text-zinc-800 dark:text-zinc-200`

### `Modal`
- Backdrop: `bg-black/60` (was `bg-black/50`)
- Card: `bg-white dark:bg-zinc-900 rounded-2xl`
- Close button: `bg-stone-100 dark:bg-zinc-800`
- Animation: `slide` (was `fade`) — more natural for bottom-anchored forms

### `InputFiled` (`src/utils/components/Form/InputFiled.tsx`)
- Border default: `border-stone-200 dark:border-zinc-700`
- Border focus: `border-indigo-500` (via onFocus/onBlur local state)
- Background: `bg-white dark:bg-zinc-800`
- Label: `text-zinc-700 dark:text-zinc-300 text-xs font-medium`
- Text: `text-zinc-900 dark:text-zinc-50`

### `SelectField`
- Same tokens as InputFiled for visual consistency
- Selected item highlight: `bg-indigo-50 dark:bg-indigo-900/30`
- Selected text: `text-indigo-600 dark:text-indigo-400 font-semibold`

---

## Screen Changes

### `LoginScreen`
- Background: `bg-stone-50 dark:bg-zinc-950`
- Card: add `shadow-sm`, border `border-stone-200 dark:border-zinc-800`
- Add `Package` icon (lucide) above title as brand mark
- Login button: `bg-indigo-500` (was `bg-black`)

### `HomeScreen`
- Background: `bg-stone-50 dark:bg-zinc-950`
- Header: add `ThemeToggle` component next to logout button
- Cards in MetricsSection/LowStockSection: `bg-white dark:bg-zinc-900 shadow-sm`

### `BranchesScreen` / `ProductHomeScreen` / `MovimientosScreen`
- Root wrapper: `flex-1 bg-stone-50 dark:bg-zinc-950`
- Primary action buttons: `bg-indigo-500`
- No structural changes

### `UsuariosScreen`
- User cards: `bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800`
- Active/inactive badge: migrate from inline classes to `statusClass()` from `ColorHerlper`
- Header button: `bg-indigo-500`

### `EmpresasScreen`
- Same base tokens: `bg-stone-50 dark:bg-zinc-950`, cards `bg-white dark:bg-zinc-900`

---

## Implementation Order

1. Install `@expo-google-fonts/inter`, register font in `_layout.tsx`
2. Create `ThemeToggle` component + restore theme on app start
3. Update `ButtonCustom`, `InputFiled`, `SelectField`, `Modal` (shared components first)
4. Update `DataTable`
5. Update screens: `LoginScreen` → `HomeScreen` → rest

---

## Out of Scope

- No logic changes anywhere
- No new screens or routes
- No animation library additions (use existing RN Animated)
- No layout restructuring beyond wrapper background color
