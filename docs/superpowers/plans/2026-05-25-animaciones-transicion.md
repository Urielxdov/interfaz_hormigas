# Animaciones de Transición Fluidas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar animaciones de transición fluidas (fade + slide, ~280ms) en pantallas, tabs, modales y listas usando react-native-reanimated.

**Architecture:** Híbrido — expo-router `screenOptions` para transiciones de Stack/Tabs, Reanimated `withTiming` y `FadeInDown` para modal y listas. No se instalan dependencias nuevas.

**Tech Stack:** React Native, Expo Router 6, react-native-reanimated 4.1.1, NativeWind

---

## File Map

| Archivo | Acción | Qué hace |
|---|---|---|
| `app/_layout.tsx` | Modificar | `fade_from_bottom` 280ms como default del Stack |
| `app/(branche)/_layout.tsx` | Crear | Stack nested con `slide_from_right` para pantallas de detalle |
| `app/(tabs)/_layout.tsx` | Modificar | `AnimatedTabIcon` con scale spring en ícono activo |
| `src/utils/components/Modal.tsx` | Modificar | Reemplazar animación nativa por `withTiming` de Reanimated |
| `src/utils/components/DataTable.tsx` | Modificar | Filas con `FadeInDown` stagger por índice |
| `src/utils/components/product/ProductCard.tsx` | Modificar | `FadeInDown` stagger via prop `index` |
| `src/utils/components/product/ProductList.tsx` | Modificar | Pasar `index` a `ProductCard` |
| `src/utils/components/InformationCard.tsx` | Modificar | `FadeIn.duration(300)` en entrada |

---

## Task 1: Transición del Stack raíz

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Agregar `animation` a Stack screenOptions**

Reemplazar el bloque `<Stack ...>` en `app/_layout.tsx`:

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
          animation: 'fade_from_bottom',
          animationDuration: 280,
          header: () => <Header />,
        }}
      >
        <Stack.Screen name='(login)' options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: true }} />
        <Stack.Screen name='(superadmin)' options={{ headerShown: false, animation: 'fade' }} />
      </Stack>
    </SafeAreaProvider>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

Arrancar app: `npx expo start`
- Navegar de login → home: debe verse fade suave
- Navegar de tab a cualquier pantalla externa: sube desde abajo + fade

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/app/_layout.tsx
git commit -m "feat(anim): fade_from_bottom 280ms en stack raíz"
```

---

## Task 2: Stack de detalle de sucursal (slide_from_right)

**Files:**
- Create: `app/(branche)/_layout.tsx`

- [ ] **Step 1: Crear layout para grupo branche**

Crear archivo `apps/mobile/hormigas_mobile/app/(branche)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router'

export default function BrancheLayout() {
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

- [ ] **Step 2: Verificar visualmente**

En app: navegar desde tab de sucursales → detalle de sucursal.
- Debe deslizarse de derecha a izquierda
- Al presionar back: desliza de izquierda a derecha
- Header sigue visible (viene del Stack raíz)

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/hormigas_mobile/app/(branche)/_layout.tsx"
git commit -m "feat(anim): slide_from_right para pantallas de detalle de sucursal"
```

---

## Task 3: Íconos animados en tab bar

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Reemplazar tab bar con AnimatedTabIcon**

Reemplazar todo el contenido de `apps/mobile/hormigas_mobile/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect } from 'react'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'

type IconName = React.ComponentProps<typeof Ionicons>['name']

type TabConfig = {
  name: string
  focusedIcon: IconName
  unfocusedIcon: IconName
}

const TABS: TabConfig[] = [
  { name: 'home',        focusedIcon: 'home',          unfocusedIcon: 'home-outline' },
  { name: 'branche',     focusedIcon: 'business',      unfocusedIcon: 'business-outline' },
  { name: 'movimientos', focusedIcon: 'swap-vertical', unfocusedIcon: 'swap-vertical-outline' },
  { name: 'products',    focusedIcon: 'cube',          unfocusedIcon: 'cube-outline' },
  { name: 'users',       focusedIcon: 'people',        unfocusedIcon: 'people-outline' },
]

interface AnimatedTabIconProps {
  name: IconName
  color: string
  size: number
  focused: boolean
}

function AnimatedTabIcon({ name, color, size, focused }: AnimatedTabIconProps) {
  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { stiffness: 200, damping: 20 })
  }, [focused])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#dbdbdb',
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      }}
    >
      {TABS.map(({ name, focusedIcon, unfocusedIcon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon
                name={focused ? focusedIcon : unfocusedIcon}
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

En app: cambiar entre tabs.
- Ícono activo hace scale sutil (1.0 → 1.15) al seleccionar
- Sin bounce exagerado, ~250ms

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/hormigas_mobile/app/(tabs)/_layout.tsx"
git commit -m "feat(anim): AnimatedTabIcon con spring scale en tab activo"
```

---

## Task 4: Animación de Modal con Reanimated

**Files:**
- Modify: `src/utils/components/Modal.tsx`

- [ ] **Step 1: Reemplazar Modal con animación Reanimated**

Reemplazar todo el contenido de `apps/mobile/hormigas_mobile/src/utils/components/Modal.tsx`:

```tsx
import { ReactNode, useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal as NativeModal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated'
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
  const [visible, setVisible] = useState(false)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(40)

  useEffect(() => {
    if (isOpen) {
      opacity.value = 0
      translateY.value = 40
      setVisible(true)
      opacity.value = withTiming(1, { duration: 220 })
      translateY.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      })
    }
  }, [isOpen])

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 180 })
    translateY.value = withTiming(
      40,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(setVisible)(false)
          runOnJS(onClose)()
        }
      }
    )
  }

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <NativeModal
      animationType='none'
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }, overlayStyle]}
          className='items-center justify-center px-6'
        >
          <Animated.View
            style={cardStyle}
            className='w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-lg max-h-[90%]'
          >
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
              keyboardShouldPersistTaps='handled'
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
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </NativeModal>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

En app: abrir cualquier modal (crear producto, crear usuario, etc.)
- Apertura: overlay hace fade in, card sube desde abajo + fade in (~280ms)
- Cierre (X o Aceptar): card baja + fade out, overlay desaparece (~220ms)
- Teclado: modal sube cuando se abre teclado (KeyboardAvoidingView activo)

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/Modal.tsx
git commit -m "feat(anim): modal con fade+slide Reanimated, reemplaza animación nativa"
```

---

## Task 5: Stagger en filas de DataTable

**Files:**
- Modify: `src/utils/components/DataTable.tsx`

- [ ] **Step 1: Agregar FadeInDown con stagger a filas**

Modificar `apps/mobile/hormigas_mobile/src/utils/components/DataTable.tsx`:

Agregar import al inicio:
```tsx
import Animated, { FadeInDown } from 'react-native-reanimated'
```

Reemplazar el bloque `data.map` (líneas 86-110):
```tsx
{data.map((row, i) => (
  <Animated.View
    key={i}
    entering={FadeInDown.delay(Math.min(i * 50, 300)).duration(260)}
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
  </Animated.View>
))}
```

- [ ] **Step 2: Verificar visualmente**

En app: navegar a cualquier pantalla con tabla (movimientos, inventario).
- Filas entran en cascada: primera inmediata, cada fila 50ms después de la anterior
- Delay tope en 300ms (fila 7+) para no esperar demasiado en listas largas

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/DataTable.tsx
git commit -m "feat(anim): FadeInDown stagger en filas de DataTable"
```

---

## Task 6: Stagger en ProductCard

**Files:**
- Modify: `src/utils/components/product/ProductCard.tsx`
- Modify: `src/utils/components/product/ProductList.tsx`

- [ ] **Step 1: Agregar prop `index` a ProductCard y animar**

Reemplazar todo el contenido de `apps/mobile/hormigas_mobile/src/utils/components/product/ProductCard.tsx`:

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Text, View } from 'react-native'

export interface ProductCardProps {
  name: string
  sku: string
  location: string
  category: string
  stock: number
  maxStock: number
  status: 'Bajo' | 'Critico' | 'Normal'
  index?: number
}

const statusConfig = {
  Critico: { bg: 'bg-red-500', text: 'text-white' },
  Bajo: { bg: 'bg-orange-500', text: 'text-white' },
  Normal: { bg: 'bg-green-500', text: 'text-white' }
}

export default function ProductCard({
  name,
  sku,
  location,
  category,
  stock,
  maxStock,
  status,
  index = 0,
}: ProductCardProps) {
  const { bg, text } = statusConfig[status]
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 50, 300)).duration(260)}
      className='flex-1 flex-row justify-between py-3 px-2 border-t border-gray-200'
    >
      <View>
        <Text className='font-bold text-xl'>{name}</Text>
        <Text className='text-gray-600'>{sku}</Text>
        <Text className='text-gray-600'>{location}  •   {category}</Text>
      </View>
      <View className='flex flex-col gap-2'>
        <View className={`flex ${bg} p-1 rounded-2xl px-2`}>
          <Text className={`${text}`}>{status}</Text>
        </View>
        <Text>{stock}/{maxStock}</Text>
      </View>
    </Animated.View>
  )
}
```

- [ ] **Step 2: Pasar `index` desde ProductList**

Reemplazar todo el contenido de `apps/mobile/hormigas_mobile/src/utils/components/product/ProductList.tsx`:

```tsx
import { LucideIcon } from 'lucide-react-native'
import { FlatList, Text } from 'react-native'
import { View } from 'react-native'
import ProductCard, { ProductCardProps } from './ProductCard'

interface ProductListProps {
  title: string
  description: string
  icon: LucideIcon
  products: ProductCardProps[]
}

export default function ProductList({
  title,
  description,
  icon: Icon,
  products,
}: ProductListProps) {
  return (
    <View className='flex flex-col border rounded-t-xl rounded-b-xl border-gray-200'>
      <View className='p-2'>
        <View className='flex flex-row items-center gap-3'>
          <Icon size={40} color='blue' />
          <Text className='font-bold text-2xl'>{title}</Text>
        </View>
        <Text className='text-gray-600'>{description}</Text>
      </View>
      <FlatList
        data={products}
        keyExtractor={item => item.sku}
        scrollEnabled={false}
        renderItem={({ item, index }) => <ProductCard {...item} index={index} />}
      />
    </View>
  )
}
```

- [ ] **Step 3: Verificar visualmente**

En app: navegar a pantalla de productos.
- Cards entran en cascada con FadeInDown, 50ms de diferencia entre cada uno

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/product/ProductCard.tsx
git add apps/mobile/hormigas_mobile/src/utils/components/product/ProductList.tsx
git commit -m "feat(anim): FadeInDown stagger en ProductCard via prop index"
```

---

## Task 7: FadeIn en InformationCard

**Files:**
- Modify: `src/utils/components/InformationCard.tsx`

- [ ] **Step 1: Agregar FadeIn a InformationCard**

Reemplazar todo el contenido de `apps/mobile/hormigas_mobile/src/utils/components/InformationCard.tsx`:

```tsx
import { type LucideIcon } from 'lucide-react-native'
import { Text, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
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
  iconBgColor,
}: InformationCardProps) {
  const isTablet = useIsTablet()
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
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
    </Animated.View>
  )
}
```

- [ ] **Step 2: Verificar visualmente**

En app: navegar a home o pantalla de productos donde aparecen InformationCards.
- Cards aparecen con fade suave de 300ms al cargar la pantalla

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/InformationCard.tsx
git commit -m "feat(anim): FadeIn 300ms en InformationCard"
```
