import { useColorScheme } from 'nativewind'

/**
 * Paleta de las pantallas del POS (StyleSheet). Sigue el tema claro/oscuro de la app
 * (el mismo que usa NativeWind y ThemeToggle).
 */
const light = {
    screen: '#fafaf9', // stone-50
    card: '#ffffff',
    border: '#e7e5e4', // stone-200
    divider: '#f5f5f4', // stone-100
    text: '#18181b', // zinc-900
    textSecondary: '#3f3f46', // zinc-700
    muted: '#71717a', // zinc-500
    faint: '#a1a1aa', // zinc-400
    placeholder: '#a1a1aa',
    primary: '#6366f1', // indigo-500
    onPrimary: '#ffffff',
    controlBg: '#f5f5f4',
    danger: '#ef4444',
    dangerBg: '#fef2f2',
    success: '#059669',
    successBg: '#ecfdf5',
    warning: '#d97706',
    warningText: '#92400e',
    warningBg: '#fffbeb',
    info: '#2563eb',
    infoBg: '#eff6ff',
}

export type PosColors = typeof light

const dark: PosColors = {
    screen: '#09090b', // zinc-950
    card: '#18181b', // zinc-900
    border: '#27272a', // zinc-800
    divider: '#27272a',
    text: '#fafafa', // zinc-50
    textSecondary: '#d4d4d8', // zinc-300
    muted: '#a1a1aa', // zinc-400
    faint: '#71717a', // zinc-500
    placeholder: '#71717a',
    primary: '#6366f1',
    onPrimary: '#ffffff',
    controlBg: '#27272a',
    danger: '#f87171',
    dangerBg: 'rgba(220, 38, 38, 0.15)',
    success: '#34d399',
    successBg: 'rgba(16, 185, 129, 0.15)',
    warning: '#fbbf24',
    warningText: '#fcd34d',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    info: '#60a5fa',
    infoBg: 'rgba(37, 99, 235, 0.18)',
}

export const POS_COLORS = { light, dark }

export function usePosColors(): PosColors {
    const { colorScheme } = useColorScheme()
    return colorScheme === 'dark' ? dark : light
}
