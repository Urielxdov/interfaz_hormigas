import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  type: ToastType
  title: string
  message?: string
  /** Icono de Ionicons en lugar del del tipo (ej. 'cloud-offline'). */
  icon?: keyof typeof Ionicons.glyphMap
  /** ms visible; por defecto 3.5 s (errores 5 s). */
  duration?: number
}

interface ToastApi {
  show: (opts: ToastOptions) => void
  hide: () => void
}

const ToastContext = createContext<ToastApi | null>(null)

const STYLES: Record<ToastType, { bg: string; border: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: '#052e16', border: '#16a34a', fg: '#dcfce7', icon: 'checkmark-circle' },
  error: { bg: '#450a0a', border: '#dc2626', fg: '#fee2e2', icon: 'close-circle' },
  warning: { bg: '#451a03', border: '#d97706', fg: '#fef3c7', icon: 'alert-circle' },
  info: { bg: '#172554', border: '#2563eb', fg: '#dbeafe', icon: 'information-circle' },
}

/**
 * Avisos flotantes de toda la app (venta registrada, venta guardada sin conexion,
 * rechazos del servidor, ventas pendientes enviadas...). Un aviso nuevo reemplaza al anterior.
 */
export function ToastProvider ({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null)
  const anim = useRef(new Animated.Value(0)).current
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null))
  }, [anim])

  const show = useCallback((opts: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ ...opts, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    anim.setValue(0)
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start()
    timer.current = setTimeout(hide, toast.duration ?? (toast.type === 'error' ? 5000 : 3500))
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [toast, anim, hide])

  const api = useMemo(() => ({ show, hide }), [show, hide])
  const s = toast ? STYLES[toast.type] : null

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && s && (
        <Animated.View
          pointerEvents='box-none'
          style={[
            styles.wrap,
            {
              top: insets.top + 8,
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
            },
          ]}
        >
          <Pressable
            onPress={hide}
            accessibilityRole='alert'
            style={[styles.toast, { backgroundColor: s.bg, borderColor: s.border }]}
          >
            <Ionicons name={toast.icon ?? s.icon} size={24} color={s.border} />
            <View style={styles.texts}>
              <Text style={[styles.title, { color: s.fg }]}>{toast.title}</Text>
              {toast.message ? <Text style={[styles.message, { color: s.fg }]}>{toast.message}</Text> : null}
            </View>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}

export function useToast (): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 1000, elevation: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  texts: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700' },
  message: { fontSize: 13, marginTop: 2, opacity: 0.9 },
})
