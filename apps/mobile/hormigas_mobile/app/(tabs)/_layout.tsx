import { Tabs, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import RoleGate from '@/src/login/components/RoleGate'
import { useAuth } from '@/src/login/hooks/useAuth'
import { ROUTE_ACCESS } from '@/src/login/utils/session'

type IconName = React.ComponentProps<typeof Ionicons>['name']

type TabConfig = {
  name: string
  title: string
  focusedIcon: IconName
  unfocusedIcon: IconName
}

const TABS: TabConfig[] = [
  { name: 'home',        title: 'Inicio',      focusedIcon: 'home',          unfocusedIcon: 'home-outline' },
  { name: 'branche',     title: 'Sucursales',  focusedIcon: 'business',      unfocusedIcon: 'business-outline' },
  { name: 'movimientos', title: 'Movim.',      focusedIcon: 'swap-vertical', unfocusedIcon: 'swap-vertical-outline' },
  { name: 'products',    title: 'Productos',   focusedIcon: 'cube',          unfocusedIcon: 'cube-outline' },
  { name: 'users',       title: 'Usuarios',    focusedIcon: 'people',        unfocusedIcon: 'people-outline' },
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

/** Panel de administracion: solo ADMIN y SUPER_ADMIN (un USER que llegue aqui va al POS). */
export default function TabLayout() {
  return (
    <RoleGate allow={ROUTE_ACCESS.admin}>
      <AdminTabs />
    </RoleGate>
  )
}

function AdminTabs() {
  const { role } = useAuth()
  const dark = useColorScheme() === 'dark'

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: dark ? '#a5b4fc' : '#4f46e5',
        tabBarInactiveTintColor: dark ? '#71717a' : '#71717a',
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 10 },
        tabBarStyle: {
          backgroundColor: dark ? '#18181b' : '#fff',
          borderTopWidth: 0.5,
          borderTopColor: dark ? '#27272a' : '#e7e5e4',
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        headerShown: false,
      }}
    >
      {TABS.map(({ name, title, focusedIcon, unfocusedIcon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
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
      {/* Acceso al punto de venta (solo ADMIN): abre el POS encima del panel. */}
      <Tabs.Screen
        name='pos'
        options={{
          title: 'Vender',
          href: role === 'ADMIN' ? undefined : null,
          tabBarAccessibilityLabel: 'Punto de venta',
          tabBarIcon: ({ focused, color, size }) => (
            <AnimatedTabIcon
              name={focused ? 'cart' : 'cart-outline'}
              size={size}
              color={color}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: e => {
            e.preventDefault()
            router.push('/(pos)/venta')
          },
        }}
      />
    </Tabs>
  )
}
