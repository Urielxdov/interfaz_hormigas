import { useBreakpoint } from './useBreakpoint'

export default function useIsTablet(): boolean {
  return useBreakpoint() !== 'phone'
}
