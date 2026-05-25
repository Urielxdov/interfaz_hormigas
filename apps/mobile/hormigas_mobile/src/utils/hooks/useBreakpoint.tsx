import { useWindowDimensions } from 'react-native'
import { BREAKPOINTS } from '@/constants/breakpoints'

export type Breakpoint = 'phone' | 'tablet' | 'large'

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions()
  if (width >= BREAKPOINTS.large) return 'large'
  if (width >= BREAKPOINTS.tablet) return 'tablet'
  return 'phone'
}

export function useResponsiveValue<T>(phone: T, tablet: T, large: T): T {
  const bp = useBreakpoint()
  if (bp === 'large') return large
  if (bp === 'tablet') return tablet
  return phone
}
