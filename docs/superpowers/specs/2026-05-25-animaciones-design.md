# Diseño: Animaciones de transición fluidas

**Fecha:** 2026-05-25
**Estilo:** Custom/marca — fade + scale, moderno y minimal
**Intensidad:** Medianas (250-300ms, sin bounce exagerado)
**Enfoque:** Híbrido — expo-router screenOptions + react-native-reanimated

---

## Contexto

App React Native Expo Router con `react-native-reanimated ~4.1.1` y `react-native-gesture-handler ~2.28.0` ya instalados. Reanimated casi sin uso activo. Stack navigator y Tabs sin animaciones configuradas — Android usa defaults bruscos.

---

## Sección 1: Transiciones de pantalla (Stack)

**Archivo:** `app/_layout.tsx`

- `animation: 'fade_from_bottom'` como default del Stack — sube desde abajo + fade, 280ms
- Pantallas de detalle (ej. `(branche)/[sucursalId]/detalle`) usan `animation: 'slide_from_right'` individualmente para dar sensación de profundidad
- Stack de login: `animation: 'fade'` — transición limpia al entrar/salir de sesión

```tsx
<Stack
  screenOptions={{
    animation: 'fade_from_bottom',
    animationDuration: 280,
    header: () => <Header />,
  }}
>
  <Stack.Screen name="(login)" options={{ headerShown: false, animation: 'fade' }} />
  <Stack.Screen name="(tabs)" options={{ headerShown: true }} />
  <Stack.Screen name="(superadmin)" options={{ headerShown: false }} />
</Stack>
```

Pantallas de detalle del grupo `(branche)` reciben `animation: 'slide_from_right'` creando un `app/(branche)/_layout.tsx` nuevo con su propio `<Stack screenOptions={{ animation: 'slide_from_right', animationDuration: 280 }}>`. Esto cubre `newBranch`, `detalle`, `inventario` y `movimiento`.

---

## Sección 2: Tab bar — íconos animados

**Archivo:** `app/(tabs)/_layout.tsx`

Crear componente `AnimatedTabIcon` que usa Reanimated para animar el ícono al cambiar tab:

- Entrada: scale `1.0 → 1.15` con `withSpring` (stiffness: 200, damping: 20)
- Salida: scale `1.15 → 1.0` con `withSpring`
- Duración efectiva: ~250ms, sin bounce perceptible
- Sin cambios visuales al tab bar en sí

```tsx
function AnimatedTabIcon({ name, color, size, focused }) {
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
```

---

## Sección 3: Modal

**Archivo:** `src/utils/components/Modal.tsx`

Reemplazar animación nativa por Reanimated para control total:

- `animationType='none'` en `NativeModal` (desactiva nativo)
- Overlay (`View` de fondo negro): `FadeIn.duration(200)` / `FadeOut.duration(180)`
- Card del modal: `FadeInDown.duration(280).easing(Easing.out(Easing.cubic))` / `FadeOutDown.duration(220).easing(Easing.in(Easing.cubic))`
- Salida maneja delay antes de llamar `onClose` para que la animación complete

```tsx
// Overlay
<Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(180)}>

// Card
<Animated.View
  entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
  exiting={FadeOutDown.duration(220).easing(Easing.in(Easing.cubic))}
>
```

Aplica a todos los modales de la app automáticamente.

---

## Sección 4: Items de lista (stagger)

**Archivos:** `src/utils/components/DataTable.tsx`, `src/utils/components/product/ProductCard.tsx`, `src/utils/components/InformationCard.tsx`

Cada item entra con `FadeInDown` escalonado al cargar datos:

- Filas en `DataTable`: `FadeInDown.delay(Math.min(index * 50, 300)).duration(260)`
- `ProductCard`: mismo patrón con delay por índice
- `InformationCard`: `FadeIn.duration(300)` simple (no es lista, no requiere stagger)
- Tope de delay a 300ms para evitar esperas largas en listas de 20+ items

```tsx
<Animated.View
  entering={FadeInDown.delay(Math.min(index * 50, 300)).duration(260)}
>
  {/* contenido */}
</Animated.View>
```

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `app/_layout.tsx` | `screenOptions` con `animation: 'fade_from_bottom'` y `animationDuration: 280` |
| `app/(branche)/_layout.tsx` | Crear nuevo — Stack con `animation: 'slide_from_right'` para pantallas de detalle |
| `app/(tabs)/_layout.tsx` | Componente `AnimatedTabIcon` con Reanimated scale |
| `src/utils/components/Modal.tsx` | `animationType='none'` + `Animated.View` con `FadeInDown` |
| `src/utils/components/DataTable.tsx` | Filas en `Animated.View` con stagger `FadeInDown` |
| `src/utils/components/product/ProductCard.tsx` | Wrapper `Animated.View` con stagger `FadeInDown` |
| `src/utils/components/InformationCard.tsx` | Wrapper `Animated.View` con `FadeIn` simple |

## Dependencias

Todas ya instaladas — no se requieren nuevas dependencias.

- `react-native-reanimated ~4.1.1` ✓
- `react-native-gesture-handler ~2.28.0` ✓
