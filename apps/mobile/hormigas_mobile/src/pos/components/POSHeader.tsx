import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/src/login/hooks/useAuth'
import { usePosSession } from '@/src/pos/context/PosSessionProvider'
import { useSafeLogout } from '@/src/pos/hooks/useSafeLogout'
import { PosColors, usePosColors } from '@/src/pos/theme'
import ThemeToggle from '@/src/utils/components/ThemeToggle'
import { SaleQueueBadge } from './SaleQueueBadge'

export function POSHeader() {
    const { role } = useAuth()
    const { ownerId } = usePosSession()
    const { handleLogout, busy } = useSafeLogout()
    const insets = useSafeAreaInsets()
    const c = usePosColors()
    const styles = useMemo(() => makeStyles(c), [c])
    const isAdmin = role === 'ADMIN'

    const backToPanel = () => {
        if (router.canGoBack()) router.back()
        else router.replace('/(tabs)/home')
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
            <View style={styles.left}>
                {isAdmin ? (
                    <TouchableOpacity
                        onPress={backToPanel}
                        style={styles.iconBtn}
                        accessibilityLabel="Volver al panel de administración"
                    >
                        <Ionicons name="arrow-back" size={20} color={c.text} />
                    </TouchableOpacity>
                ) : null}
                <Text style={styles.title}>Hormigas POS</Text>
            </View>
            <View style={styles.right}>
                <SaleQueueBadge ownerId={ownerId} />
                <ThemeToggle />
                {isAdmin ? null : (
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={styles.iconBtn}
                        disabled={busy}
                        accessibilityLabel="Cerrar sesión"
                    >
                        {busy
                            ? <ActivityIndicator size="small" color={c.muted} />
                            : <Ionicons name="log-out-outline" size={20} color={c.muted} />}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}

const makeStyles = (c: PosColors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: c.card,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 17, fontWeight: '700', color: c.text },
    right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    iconBtn: { padding: 4 },
})
