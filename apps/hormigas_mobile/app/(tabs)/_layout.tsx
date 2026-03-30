// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type TabConfig = {
  name: string;
  focusedIcon: IconName;
  unfocusedIcon: IconName;
};

const TABS: TabConfig[] = [
  { name: 'home',         focusedIcon: 'home',        unfocusedIcon: 'home-outline' },
  { name: 'branche',        focusedIcon: 'business',      unfocusedIcon: 'business-outline' },
  { name: 'products', focusedIcon: 'cube', unfocusedIcon: 'cube-outline' }
  //{ name: 'reels',         focusedIcon: 'play-circle', unfocusedIcon: 'play-circle-outline' },
  //{ name: 'notifications', focusedIcon: 'heart',       unfocusedIcon: 'heart-outline' },
  //{ name: 'profile',       focusedIcon: 'person',      unfocusedIcon: 'person-outline' },
];

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
              <Ionicons
                name={focused ? focusedIcon : unfocusedIcon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}