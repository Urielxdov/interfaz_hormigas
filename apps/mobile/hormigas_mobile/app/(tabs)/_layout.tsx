import { Tabs, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect } from 'react'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import RoleGate from '@/src/login/components/RoleGate'
import { useAuth } from '@/src/login/hooks/useAuth'
import { ROUTE_ACCESS } from '@/src/login/utils/session'

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
      {/* Acceso al punto de venta (solo ADMIN): abre el POS encima del panel. */}
      <Tabs.Screen
        name='pos'
        options={{
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
