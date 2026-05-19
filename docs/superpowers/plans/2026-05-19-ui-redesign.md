# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply warm gray + dark mode toggle + indigo accent + Inter font to all screens and shared components without touching any business logic.

**Architecture:** NativeWind v4 `dark:` prefixes driven by `Appearance.setColorScheme()` from React Native. `ThemeToggle` in the global `Header` persists preference to AsyncStorage. Inter font loaded via `@expo-google-fonts/inter` and configured in `tailwind.config.js`.

**Tech Stack:** Expo 54, NativeWind 4.2.3, React Native 0.81, @expo-google-fonts/inter, @react-native-async-storage/async-storage (already installed), lucide-react-native

> **Note:** No automated test suite exists in this project. Each task ends with a visual verification step — run `pnpm start` from `apps/mobile/hormigas_mobile/` and check the targeted screen.

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/utils/components/ThemeToggle.tsx` |
| Modify | `tailwind.config.js` |
| Modify | `app/_layout.tsx` |
| Modify | `src/utils/components/Header.tsx` |
| Modify | `src/utils/components/ButtonCustom.tsx` |
| Modify | `src/utils/components/Form/InputFiled.tsx` |
| Modify | `src/utils/components/SelectField.tsx` |
| Modify | `src/utils/components/Modal.tsx` |
| Modify | `src/utils/components/DataTable.tsx` |
| Modify | `src/utils/components/InformationCard.tsx` |
| Modify | `src/utils/components/AlertCard.tsx` |
| Modify | `src/login/screens/LoginScreen.tsx` |
| Modify | `src/home/screens/HomeScreen.tsx` |
| Modify | `src/home/components/MetricsSection.tsx` |
| Modify | `src/branches/screens/BranchesScreen.tsx` |
| Modify | `src/product/screens/ProductHomeScreen.tsx` |
| Modify | `src/movimientos/screens/MovimientosScreen.tsx` |
| Modify | `src/users/screens/UsuariosScreen.tsx` |
| Modify | `src/superadmin/screens/EmpresasScreen.tsx` |

---

## Task 1: Install Inter font + configure Tailwind

**Files:**
- Modify: `apps/mobile/hormigas_mobile/package.json`
- Modify: `apps/mobile/hormigas_mobile/tailwind.config.js`

- [ ] **Step 1: Install font package**

Run from `apps/mobile/hormigas_mobile/`:
```bash
npx expo install @expo-google-fonts/inter
```
Expected: package added to node_modules, package.json updated with `@expo-google-fonts/inter`.

- [ ] **Step 2: Add Inter to tailwind.config.js**

Replace the entire file:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/tailwind.config.js apps/mobile/hormigas_mobile/package.json
git commit -m "chore(ui): install Inter font and configure tailwind fontFamily"
```

---

## Task 2: Load Inter in _layout + restore theme on startup

**Files:**
- Modify: `apps/mobile/hormigas_mobile/app/_layout.tsx`

- [ ] **Step 1: Update _layout.tsx**

Replace the entire file:
```tsx
import 'react-native-reanimated'
import '../global.css'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import Header from '@/src/utils/components/Header'
import { useInitDatabase } from '@/src/utils/hooks/useInitDatabase'
import { Text, Appearance } from 'react-native'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect } from 'react'

export const THEME_STORAGE_KEY = '@hormigas_theme'

export default function RootLayout () {
  const { isReady, error } = useInitDatabase()

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then(saved => {
      if (saved === 'dark' || saved === 'light') {
        Appearance.setColorScheme(saved)
      }
    })
  }, [])

  if (error) return <Text>Error iniciando la app</Text>
  if (!isReady || !fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          header: () => <Header />
        }}
      >
        <Stack.Screen name='(login)' options={{ headerShown: false }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: true }} />
        <Stack.Screen name='(superadmin)' options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/app/_layout.tsx
git commit -m "feat(ui): load Inter font and restore dark mode preference on startup"
```

---

## Task 3: Create ThemeToggle component

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/utils/components/ThemeToggle.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Appearance } from 'react-native'
import { TouchableOpacity } from 'react-native'
import { Moon, Sun } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { THEME_STORAGE_KEY } from '@/app/_layout'

export default function ThemeToggle () {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const toggle = async () => {
    const next = isDark ? 'light' : 'dark'
    Appearance.setColorScheme(next)
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next)
  }

  return (
    <TouchableOpacity onPress={toggle} className='p-2'>
      {isDark
        ? <Sun size={20} color='#a1a1aa' />
        : <Moon size={20} color='#71717a' />
      }
    </TouchableOpacity>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/ThemeToggle.tsx
git commit -m "feat(ui): add ThemeToggle component with AsyncStorage persistence"
```

---

## Task 4: Update Header

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/Header.tsx`

- [ ] **Step 1: Replace file**

```tsx
import { Text, View } from 'react-native'
import { Package, Wifi } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useIsTablet from '../hooks/useIsTablet'
import { useNetwork } from '../../../../shared/context/NetworkContext'
import SyncQueueBadge from './SyncQueueBadge'
import ThemeToggle from './ThemeToggle'

export default function Header () {
  const isTablet = useIsTablet()
  const insets = useSafeAreaInsets()
  const { isOnline } = useNetwork()

  return (
    <View
      className='p-4 border-b bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800'
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className='flex-row items-center'>
        <View className={`bg-indigo-500 rounded-xl ${isTablet ? 'p-4' : 'p-1'}`}>
          <Package size={isTablet ? 70 : 40} color='white' />
        </View>
        <View className='flex-1 ml-2'>
          <Text className={`font-sans-bold text-zinc-900 dark:text-zinc-50 overflow-visible ${isTablet ? 'text-4xl' : 'text-2xl'}`}>
            Sistema de Inventarios
          </Text>
          <Text className={`font-sans text-zinc-500 dark:text-zinc-400 ${isTablet ? 'text-lg' : 'text-sm'}`}>
            Panel de administración
          </Text>
        </View>
        <View className='flex-row items-center gap-2'>
          <SyncQueueBadge />
          <Wifi color={isOnline ? '#10b981' : '#ef4444'} />
          <ThemeToggle />
        </View>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: Visual verification**

Run the app (`pnpm start`). Open any tab screen. Verify:
- Header background is white (light) / zinc-900 (dark)
- Package icon is indigo (not blue)
- Moon icon visible in header
- Toggle Moon → Sun and back; background switches modes

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/Header.tsx
git commit -m "feat(ui): update Header with dark tokens, indigo icon, ThemeToggle"
```

---

## Task 5: Update ButtonCustom

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/ButtonCustom.tsx`

- [ ] **Step 1: Replace file**

```tsx
import { LucideIcon } from 'lucide-react-native'
import { GestureResponderEvent, Pressable, Text } from 'react-native'
import { Color } from '../constants/Colors'

interface ButtonCustomProps {
  title?: string
  onPress: (event: GestureResponderEvent) => void
  bgColor?: string
  disabled?: boolean
  icon?: LucideIcon
  iconColor?: Color
  iconSize?: number
  compact?: boolean
}

export default function ButtonCustom ({
  title = '',
  onPress,
  bgColor = 'bg-indigo-500',
  disabled = false,
  icon: Icon,
  iconColor = 'white',
  iconSize = 20,
  compact = false
}: ButtonCustomProps) {
  return (
    <Pressable
      className={`${bgColor} ${compact ? 'p-2' : 'px-5 py-3'} rounded-xl items-center active:opacity-75 flex-row gap-2 justify-center`}
      onPress={onPress}
      disabled={disabled}
    >
      {Icon && <Icon size={iconSize} color={iconColor} />}
      {title && <Text className='text-white font-sans-semibold text-base'>{title}</Text>}
    </Pressable>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/ButtonCustom.tsx
git commit -m "feat(ui): ButtonCustom — indigo default, rounded-xl, Inter semibold, press feedback"
```

---

## Task 6: Update InputFiled + SelectField

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/Form/InputFiled.tsx`
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/SelectField.tsx`

- [ ] **Step 1: Replace InputFiled.tsx**

```tsx
import { Ref, useState } from 'react'
import {
  KeyboardTypeOptions,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View
} from 'react-native'

type InputValue = string | number | boolean

interface InputFieldProps {
  label: string
  placeholder?: string
  secureText?: boolean
  value: InputValue
  onChangeText: (value: InputValue) => void
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send'
  onSubmitEditingProp?: () => void
  blurOnSubmitProp?: boolean
  inputRef?: Ref<TextInput>
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: TextInputProps['autoCapitalize']
}

export default function InputField({
  label,
  placeholder,
  secureText = false,
  value,
  onChangeText,
  returnKeyType = 'done',
  onSubmitEditingProp = () => {},
  blurOnSubmitProp = false,
  inputRef,
  keyboardType,
  autoCapitalize,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false)

  if (typeof value === 'boolean') {
    return (
      <View className='flex-row items-center justify-between w-full mb-2'>
        <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>
        <Switch
          value={value}
          onValueChange={(val) => onChangeText(val)}
          thumbColor='#6366f1'
          trackColor={{ true: '#a5b4fc', false: '#d4d4d8' }}
        />
      </View>
    )
  }

  const borderClass = focused
    ? 'border-indigo-500'
    : 'border-stone-200 dark:border-zinc-700'

  if (typeof value === 'number') {
    return (
      <View className='gap-1 w-full mb-2'>
        <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>
        <TextInput
          ref={inputRef}
          className={`w-full p-3.5 border ${borderClass} rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-sans`}
          placeholder={placeholder}
          placeholderTextColor='#a1a1aa'
          value={String(value)}
          onChangeText={(text) => {
            const parsed = parseFloat(text)
            onChangeText(isNaN(parsed) ? 0 : parsed)
          }}
          keyboardType='numeric'
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditingProp}
          blurOnSubmit={blurOnSubmitProp}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    )
  }

  return (
    <View className='gap-1 w-full mb-2'>
      <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>
      <TextInput
        ref={inputRef}
        className={`w-full p-3.5 border ${borderClass} rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-sans`}
        placeholder={placeholder}
        placeholderTextColor='#a1a1aa'
        secureTextEntry={secureText}
        value={value}
        onChangeText={(text) => onChangeText(text)}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditingProp}
        blurOnSubmit={blurOnSubmitProp}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  )
}
```

- [ ] **Step 2: Replace SelectField.tsx**

```tsx
import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { ChevronDown, X } from 'lucide-react-native'

export interface SelectOption {
  label: string
  value: number | string
}

interface SelectFieldProps {
  label: string
  placeholder?: string
  options: SelectOption[]
  value?: number | string | null
  onChange: (value: number | string) => void
  error?: string
}

export default function SelectField ({ label, placeholder, options, value, onChange, error }: SelectFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <View className='gap-1 mb-2'>
      <Text className='font-sans-medium text-zinc-700 dark:text-zinc-300 text-xs'>{label}</Text>
      <TouchableOpacity
        className='border border-stone-200 dark:border-zinc-700 rounded-xl px-3.5 py-3.5 flex-row items-center justify-between bg-white dark:bg-zinc-800'
        onPress={() => setOpen(true)}
      >
        <Text className={`font-sans ${selected ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`}>
          {selected ? selected.label : (placeholder ?? 'Seleccionar...')}
        </Text>
        <ChevronDown size={16} color='#a1a1aa' />
      </TouchableOpacity>
      {error && <Text className='text-red-500 text-xs font-sans'>{error}</Text>}

      <Modal visible={open} transparent animationType='slide'>
        <Pressable className='flex-1 bg-black/60 justify-end' onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}}>
            <View className='bg-white dark:bg-zinc-900 rounded-t-2xl max-h-96'>
              <View className='flex-row items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-zinc-800'>
                <Text className='font-sans-semibold text-zinc-900 dark:text-zinc-50 text-base'>{label}</Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <X size={20} color='#71717a' />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {options.map(opt => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    className={`px-4 py-3.5 border-b border-stone-50 dark:border-zinc-800 ${opt.value === value ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                    onPress={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                  >
                    <Text className={`font-sans text-base ${opt.value === value ? 'font-sans-semibold text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/Form/InputFiled.tsx apps/mobile/hormigas_mobile/src/utils/components/SelectField.tsx
git commit -m "feat(ui): InputFiled + SelectField — indigo focus, dark tokens, Inter font"
```

---

## Task 7: Update Modal

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/Modal.tsx`

- [ ] **Step 1: Replace file**

```tsx
import { ReactNode, useEffect, useState } from 'react'
import {
  Modal as NativeModal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import ButtonCustom from './ButtonCustom'
import { X } from 'lucide-react-native'

type ModalVariant = 'confirm' | 'info'

interface ModalProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  variant?: ModalVariant
  onSubmit?: () => void
  submitTitle?: string
}

export default function Modal({
  children,
  isOpen,
  onClose,
  variant = 'confirm',
  onSubmit,
  submitTitle,
}: ModalProps) {
  const [visible, setVisible] = useState(isOpen)

  useEffect(() => {
    setVisible(isOpen)
  }, [isOpen])

  const handleClose = () => {
    setVisible(false)
    onClose()
  }

  return (
    <NativeModal
      animationType='slide'
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View className='flex-1 items-center justify-center bg-black/60 px-6'>
        <View className='w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-lg max-h-[90%]'>
          <View className='flex w-2/12 mb-2'>
            <Pressable
              onPress={handleClose}
              className='bg-stone-100 dark:bg-zinc-800 p-2 rounded-xl items-center'
            >
              <X size={18} color='#71717a' />
            </Pressable>
          </View>

          <ScrollView
            className='mb-4'
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {children}
          </ScrollView>

          <View className='flex-row justify-end gap-3'>
            {variant === 'info' ? (
              <Pressable
                className='rounded-xl bg-indigo-500 px-5 py-3'
                onPress={handleClose}
              >
                <Text className='font-sans-semibold text-white'>Aceptar</Text>
              </Pressable>
            ) : (
              onSubmit && (
                <Pressable
                  className='rounded-xl bg-indigo-500 px-5 py-3'
                  onPress={onSubmit}
                >
                  <Text className='font-sans-semibold text-white'>
                    {submitTitle ?? 'Confirmar'}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        </View>
      </View>
    </NativeModal>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/Modal.tsx
git commit -m "feat(ui): Modal — slide animation, dark tokens, indigo confirm button"
```

---

## Task 8: Update DataTable + InformationCard + AlertCard

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/DataTable.tsx`
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/InformationCard.tsx`
- Read first: `apps/mobile/hormigas_mobile/src/utils/components/AlertCard.tsx`

- [ ] **Step 1: Replace DataTable.tsx**

```tsx
import { LucideIcon } from 'lucide-react-native'
import React, { useState, useCallback } from 'react'
import useIsTablet from '../hooks/useIsTablet'
import { ScrollView, View, LayoutChangeEvent } from 'react-native'
import { Text } from 'react-native'

export interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  title: string
  description?: string
  icon: LucideIcon
}

export default function DataTable<T>({
  columns,
  data,
  title,
  description,
  icon: Icon
}: DataTableProps<T>) {
  const isTablet = useIsTablet()
  const totalCells = (data.length + 1) * columns.length

  const [colWidths, setColWidths] = useState<Record<string, number>>({})
  const [measuredCount, setMeasuredCount] = useState(0)
  const measured = measuredCount >= totalCells

  const handleLayout = useCallback((colKey: string, e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width
    setColWidths(prev => {
      const current = prev[colKey] ?? 0
      if (width <= current) return prev
      return { ...prev, [colKey]: width }
    })
    setMeasuredCount(prev => {
      if (prev >= totalCells) return prev
      return prev + 1
    })
  }, [totalCells])

  const getCellStyle = (key: string) => {
    if (!measured) return {}
    const width = colWidths[key]
    return width ? { width } : { flex: 1 }
  }

  return (
    <View className='border rounded-2xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden'>
      <View className='p-4'>
        <View className='flex flex-row items-center gap-2'>
          <Icon size={24} color='#6366f1' />
          <Text className='font-sans-bold text-zinc-900 dark:text-zinc-50'>{title}</Text>
        </View>
        {description && (
          <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm mt-1'>{description}</Text>
        )}
      </View>

      <ScrollView horizontal={!isTablet} scrollEnabled={!isTablet}>
        <View>
          <View className='flex-row border-t border-stone-100 dark:border-zinc-800 px-3 py-2 bg-stone-50 dark:bg-zinc-800/60'>
            {columns.map(col => {
              const key = String(col.key)
              return (
                <View
                  key={key}
                  style={getCellStyle(key)}
                  onLayout={e => handleLayout(key, e)}
                  className='pr-4'
                >
                  <Text className='font-sans-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase text-center tracking-wide'>
                    {col.label}
                  </Text>
                </View>
              )
            })}
          </View>

          {data.map((row, i) => (
            <View
              key={i}
              className={`flex-row border-t border-stone-100 dark:border-zinc-800 px-3 py-3 ${
                i % 2 === 0 ? '' : 'bg-stone-50 dark:bg-zinc-800/40'
              }`}
            >
              {columns.map(col => {
                const key = String(col.key)
                return (
                  <View
                    key={key}
                    style={getCellStyle(key)}
                    onLayout={e => handleLayout(key, e)}
                    className='pr-4'
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : <Text className='font-sans text-center text-zinc-800 dark:text-zinc-200 text-sm'>{String(row[col.key] ?? '')}</Text>
                    }
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
```

- [ ] **Step 2: Replace InformationCard.tsx**

```tsx
import { type LucideIcon } from 'lucide-react-native'
import { Text, View } from 'react-native'
import useIsTablet from '../hooks/useIsTablet'
import { Color } from '../constants/Colors'
import { bgClass } from '../helpers/ColorHerlper'

interface InformationCardProps {
  title: string
  description: string
  icon: LucideIcon
  iconBgColor: Color
}

export default function InformationCard ({
  title,
  description,
  icon: Icon,
  iconBgColor
}: InformationCardProps) {
  const isTablet = useIsTablet()
  return (
    <View
      className={`flex-row gap-8 p-4 border items-center rounded-2xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900
        ${isTablet ? 'w-4/12' : 'w-10/12'} justify-between self-center`}
    >
      <View className='flex-col gap-2'>
        <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm'>{title}</Text>
        <Text className='font-sans-bold text-zinc-900 dark:text-zinc-50 text-3xl'>{description}</Text>
      </View>
      <View className={`${bgClass(iconBgColor, 600)} p-3 rounded-xl`}>
        <Icon size={36} color='white' />
      </View>
    </View>
  )
}
```

- [ ] **Step 3: Update AlertCard.tsx**

Read `src/utils/components/AlertCard.tsx` first, then apply:
- Container: replace `bg-white border-gray-*` → `bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800`
- Title text: add `dark:text-zinc-50`
- Description text: add `dark:text-zinc-400`
- Keep all other props/logic unchanged

- [ ] **Step 4: Visual verification**

Run app, go to Home tab. Verify:
- DataTable has alternating row shading
- InformationCard icons are colored, card bg follows theme
- Toggle dark mode — all cards switch correctly

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/DataTable.tsx apps/mobile/hormigas_mobile/src/utils/components/InformationCard.tsx apps/mobile/hormigas_mobile/src/utils/components/AlertCard.tsx
git commit -m "feat(ui): DataTable alternating rows + indigo icon; InformationCard + AlertCard dark tokens"
```

---

## Task 9: Update LoginScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/login/screens/LoginScreen.tsx`

- [ ] **Step 1: Replace file**

```tsx
import { useAuth, isSuperAdminToken } from '@/src/login/hooks/useAuth'
import { TokenServiceImpl } from '@hormigas/infrastructure'
import { storage } from '@/src/adapters/AsyncStorageAdapter'

const tokenService = new TokenServiceImpl(storage)
import ButtonCustom from '@/src/utils/components/ButtonCustom'
import Form, { FormFieldConfig } from '@/src/utils/components/Form'
import { router } from 'expo-router'
import { useForm } from 'react-hook-form'
import { Text, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Package } from 'lucide-react-native'

type LoginFormValues = {
  email: string
  password: string
}

const LOGIN_FIELDS: FormFieldConfig<LoginFormValues>[] = [
  {
    name: 'email',
    label: 'Email',
    placeholder: 'tu@email.com',
    autoCapitalize: 'none',
    rules: { required: 'El email es obligatorio' }
  },
  {
    name: 'password',
    label: 'Contrasena',
    placeholder: '********',
    secureTextEntry: true,
    rules: { required: 'La contrasena es obligatoria' }
  }
]

export default function LoginScreen () {
  const { login } = useAuth()
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' }
  })

  const handleLogin = async (data: LoginFormValues) => {
    try {
      await login(data)
      const token = await tokenService.getToken()
      const superAdmin = token ? isSuperAdminToken(token) : false
      router.replace(superAdmin ? '/(superadmin)' : '/(tabs)/home')
    } catch (error) {
      console.error('[LoginScreen] Error:', error)
    }
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      keyboardShouldPersistTaps='handled'
      enableOnAndroid
      extraScrollHeight={20}
      className='bg-stone-50 dark:bg-zinc-950'
    >
      <View className='w-11/12 self-center rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm'>
        <View className='flex flex-col gap-4'>
          <View className='items-center mb-2'>
            <View className='bg-indigo-500 p-4 rounded-2xl mb-4'>
              <Package size={36} color='white' />
            </View>
            <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Iniciar Sesión</Text>
            <Text className='font-sans text-zinc-500 dark:text-zinc-400 text-sm text-center mt-1'>
              Ingresa tus credenciales para acceder
            </Text>
          </View>

          <Form
            control={control}
            errors={errors}
            fields={LOGIN_FIELDS}
            scrollable={false}
          />

          <ButtonCustom
            title='Iniciar sesión'
            onPress={handleSubmit(handleLogin)}
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  )
}
```

- [ ] **Step 2: Visual verification**

Run app. Check login screen:
- Background is `stone-50` warm gray
- Card has soft shadow and `stone-200` border
- Package icon in indigo square at top
- Indigo login button
- Toggle dark mode from another screen, then return to login — dark bg + dark card visible

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/login/screens/LoginScreen.tsx
git commit -m "feat(ui): LoginScreen — warm bg, Package brand icon, indigo button, dark tokens"
```

---

## Task 10: Update HomeScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/home/screens/HomeScreen.tsx`

- [ ] **Step 1: Replace file**

```tsx
import LowStockSection from '@/src/home/components/LowStockSection'
import MetricsSection from '@/src/home/components/MetricsSection'
import { useAuth } from '@/src/login/hooks/useAuth'
import { router } from 'expo-router'
import { LogOut } from 'lucide-react-native'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import BranchSummaryScreen from '../components/BranchSummaryScreen'

export default function HomeScreen () {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace('/(login)')
  }

  return (
    <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
      <View className='bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 flex-row items-center justify-between'>
        <Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Inicio</Text>
        <TouchableOpacity onPress={handleLogout} className='p-2'>
          <LogOut size={20} color='#71717a' />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ gap: 16, padding: 16 }}>
        <MetricsSection />
        <LowStockSection />
        <BranchSummaryScreen />
      </ScrollView>
    </View>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/home/screens/HomeScreen.tsx
git commit -m "feat(ui): HomeScreen — stone-50 bg, dark tokens, Inter font"
```

---

## Task 11: Update BranchesScreen + ProductHomeScreen + MovimientosScreen

All three follow the same pattern: add `flex-1 bg-stone-50 dark:bg-zinc-950` wrapper + indigo primary buttons.

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx`
- Modify: `apps/mobile/hormigas_mobile/src/product/screens/ProductHomeScreen.tsx`
- Modify: `apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx`

- [ ] **Step 1: Update BranchesScreen.tsx**

Change only the root `<View>` wrapper and the subtitle text color. Replace:
```tsx
return (
  <View>
    <View className='w-11/12 self-center gap-2'>
```
With:
```tsx
return (
  <View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
    <View className='w-11/12 self-center gap-2 pt-4'>
```

Change subtitle text:
```tsx
// Before:
<Text className='text-gray-400'>
// After:
<Text className='font-sans text-zinc-500 dark:text-zinc-400'>
```

Change page title:
```tsx
// Before:
<Text className='text-2xl font-bold'>Sucursales</Text>
// After:
<Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Sucursales</Text>
```

- [ ] **Step 2: Update ProductHomeScreen.tsx**

Apply same wrapper + text changes:

Root wrapper:
```tsx
// Before:
<View>
  <View className='w-11/12 self-center gap-2'>
// After:
<View className='flex-1 bg-stone-50 dark:bg-zinc-950'>
  <View className='w-11/12 self-center gap-2 pt-4'>
```

Edit button: change `bgColor='bg-blue-500'` → `bgColor='bg-indigo-500'` (2 occurrences in action columns).

Title + subtitle:
```tsx
// Before:
<Text className='text-2xl font-bold'>Productos</Text>
<Text className='text-gray-400'>
// After:
<Text className='font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50'>Productos</Text>
<Text className='font-sans text-zinc-500 dark:text-zinc-400'>
```

- [ ] **Step 3: Update MovimientosScreen.tsx**

Root wrapper:
```tsx
// Before:
<View className="flex-1 bg-gray-50">
// After:
<View className="flex-1 bg-stone-50 dark:bg-zinc-950">
```

Header title + subtitle:
```tsx
// Before:
<Text className="text-2xl font-bold">Movimientos</Text>
<Text className="text-gray-500 text-sm">Historial de entradas y salidas</Text>
// After:
<Text className="font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50">Movimientos</Text>
<Text className="font-sans text-zinc-500 dark:text-zinc-400 text-sm">Historial de entradas y salidas</Text>
```

Register button: change `bg-black` → `bg-indigo-500`.

Movement cards:
```tsx
// Before:
<View key={m.id} className="bg-white rounded-xl p-4 mb-2 border border-gray-100">
// After:
<View key={m.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-2 border border-stone-100 dark:border-zinc-800">
```

Text in cards: add `dark:text-zinc-*` variants:
- `text-gray-900` → `text-zinc-900 dark:text-zinc-50`
- `text-gray-500` → `text-zinc-500 dark:text-zinc-400`
- `text-gray-400` → `text-zinc-400 dark:text-zinc-500`

Registration modal card:
```tsx
// Before:
<View className="bg-white rounded-t-2xl p-6 gap-4">
// After:
<View className="bg-white dark:bg-zinc-900 rounded-t-2xl p-6 gap-4">
```

Label texts in modal form: `text-gray-700` → `text-zinc-700 dark:text-zinc-300`.
TextInputs in modal form:
```tsx
// Before:
className="border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900"
// After:
className="border border-stone-200 dark:border-zinc-700 rounded-xl px-3 py-3 text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-800"
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx apps/mobile/hormigas_mobile/src/product/screens/ProductHomeScreen.tsx apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx
git commit -m "feat(ui): BranchesScreen + ProductHomeScreen + MovimientosScreen — stone bg, dark tokens"
```

---

## Task 12: Update UsuariosScreen + EmpresasScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/users/screens/UsuariosScreen.tsx`
- Modify: `apps/mobile/hormigas_mobile/src/superadmin/screens/EmpresasScreen.tsx`

- [ ] **Step 1: Update UsuariosScreen.tsx**

Root wrapper: `bg-gray-50` → `bg-stone-50 dark:bg-zinc-950`.

Header section:
```tsx
// Before:
<View className="w-11/12 self-center mt-4 gap-2">
  <View className="flex-row items-center justify-between">
    <View>
      <Text className="text-2xl font-bold">Usuarios</Text>
      <Text className="text-gray-500 text-sm">
// After:
<View className="w-11/12 self-center mt-4 gap-2">
  <View className="flex-row items-center justify-between">
    <View>
      <Text className="font-sans-bold text-2xl text-zinc-900 dark:text-zinc-50">Usuarios</Text>
      <Text className="font-sans text-zinc-500 dark:text-zinc-400 text-sm">
```

"Nuevo" button: change `bg-black` → `bg-indigo-500`.

User cards: replace inline badge classes with `statusClass`:
```tsx
// Before (active badge):
<View className={`px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-100' : 'bg-gray-100'}`}>
  <Text className={`text-xs font-medium ${u.activo ? 'text-green-700' : 'text-gray-500'}`}>
    {u.activo ? 'Activo' : 'Inactivo'}
  </Text>
</View>
// After:
<Text className={statusClass(u.activo ? 'green' : 'gray')}>
  {u.activo ? 'Activo' : 'Inactivo'}
</Text>
```

Add `statusClass` import at top:
```tsx
import { statusClass } from '@/src/utils/helpers/ColorHerlper'
```

Card container: `bg-white rounded-xl p-4 mb-3 border border-gray-100` → `bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-3 border border-stone-100 dark:border-zinc-800`.

User name text: add `dark:text-zinc-50`.
Email text: `text-gray-500` → `text-zinc-500 dark:text-zinc-400`.
Sucursal text: `text-gray-400` → `text-zinc-400 dark:text-zinc-500`.

Modal (create user): 
- Card: `bg-white rounded-t-2xl p-6 gap-4` → add `dark:bg-zinc-900`
- Title: add `dark:text-zinc-50`
- Field labels: `text-gray-700` → `text-zinc-700 dark:text-zinc-300`
- TextInputs: `border-gray-200` → `border-stone-200 dark:border-zinc-700`, add `dark:bg-zinc-800 dark:text-zinc-50`
- "Crear" button: `bg-black` → `bg-indigo-500`

- [ ] **Step 2: Update EmpresasScreen.tsx**

Background: `bg-gray-50` → `bg-stone-50 dark:bg-zinc-950`.

Header bar:
```tsx
// Before:
<View className="bg-white border-b border-gray-200 px-5 pt-14 pb-4 ...">
// After:
<View className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 px-5 pt-14 pb-4 ...">
```

"Super Admin" label: add `dark:text-zinc-500`.
Title: add `dark:text-zinc-50`.

"Nueva" button: `bg-black` → `bg-indigo-500`.

Company cards: `bg-white rounded-xl ... border border-gray-100` → add `dark:bg-zinc-900 dark:border-zinc-800`.
Card texts: add `dark:text-zinc-*` variants matching zinc scale.

Active/inactive badge (keep existing logic, just add dark variants):
```tsx
// Before:
className={`... ${e.activo ? 'bg-green-100' : 'bg-gray-100'}`}
// After:
className={`... ${e.activo ? 'bg-green-100 dark:bg-green-900/30' : 'bg-stone-100 dark:bg-zinc-800'}`}
```

Modal (create empresa):
- `bg-white rounded-t-2xl` → add `dark:bg-zinc-900`
- Section headers: add `dark:text-zinc-500`
- Field labels: `text-gray-700` → `text-zinc-700 dark:text-zinc-300`
- TextInputs: add `dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50`
- "Crear" button: `bg-black` → `bg-indigo-500`

- [ ] **Step 3: Visual verification**

Check Users tab and (if accessible) Empresas screen. Toggle dark mode. Verify cards, badges, modal all switch.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/users/screens/UsuariosScreen.tsx apps/mobile/hormigas_mobile/src/superadmin/screens/EmpresasScreen.tsx
git commit -m "feat(ui): UsuariosScreen + EmpresasScreen — dark tokens, indigo buttons, statusClass badges"
```

---

## Task 13: Final integration commit + push

- [ ] **Step 1: Run app and do full walkthrough**

Navigate through every tab in both light and dark mode:
1. Login screen → indigo button, Package icon, warm gray bg
2. Home → metrics cards, alert cards, branch summary table all themed
3. Branches → stone bg, indigo "Nueva Sucursal" button, DataTable with alternating rows
4. Movimientos → stone bg, indigo "Registrar", dark movement cards
5. Products → stone bg, indigo "Nuevo Producto", DataTable themed
6. Users → stone bg, indigo "Nuevo" button, statusClass badges
7. Toggle dark mode → ALL screens switch
8. Close and reopen app → dark mode preference persists

- [ ] **Step 2: Push**

```bash
git push
```
