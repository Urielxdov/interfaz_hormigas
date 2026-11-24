import { useMemo } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSaleQueueStatus } from '@/src/pos/hooks/useSaleQueueStatus'
import { PosColors, usePosColors } from '@/src/pos/theme'

interface Props {
    ownerId?: string | null
}

/** Estado de la cola de ventas: pendientes, fallidas (con reintento) o al dia. */
export function SaleQueueBadge({ ownerId = null }: Props) {
    const { pendingCount, failedCount, isSyncing, retrying, retryFailed } = useSaleQueueStatus(ownerId)
    const c = usePosColors()
    const styles = useMemo(() => makeStyles(c), [c])

    const confirmRetry = () => {
        Alert.alert(
            'Ventas sin sincronizar',
            failedCount === 1
                ? '1 venta no se pudo enviar al servidor. ¿Reintentar ahora?'
                : `${failedCount} ventas no se pudieron enviar al servidor. ¿Reintentar ahora?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Reintentar', onPress: () => { retryFailed() } },
            ]
        )
    }

    const failedBadge = failedCount > 0 ? (
        <TouchableOpacity
            onPress={confirmRetry}
            disabled={retrying}
            style={[styles.badge, styles.failed]}
            accessibilityLabel={`${failedCount} ventas fallidas, tocar para reintentar`}
        >
            {retrying
                ? <ActivityIndicator size="small" color={c.danger} />
                : <Ionicons name="alert-circle" size={14} color={c.danger} />}
            <Text style={[styles.count, styles.failedText]}>{failedCount}</Text>
        </TouchableOpacity>
    ) : null

    let status: React.ReactNode
    if (isSyncing) {
        status = (
            <View style={[styles.badge, styles.syncing]}>
                <Ionicons name="sync" size={14} color={c.info} />
            </View>
        )
    } else if (pendingCount > 0) {
        status = (
            <View style={[styles.badge, styles.pending]}>
                <Ionicons name="time-outline" size={14} color={c.warning} />
                <Text style={styles.count}>{pendingCount}</Text>
            </View>
        )
    } else if (failedCount === 0) {
        status = (
            <View style={[styles.badge, styles.done]}>
                <Ionicons name="checkmark-circle" size={14} color={c.success} />
            </View>
        )
    }

    return (
        <View style={styles.row}>
            {failedBadge}
            {status}
        </View>
    )
}

const makeStyles = (c: PosColors) => StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 12,
        gap: 3,
    },
    syncing: { backgroundColor: c.infoBg },
    pending: { backgroundColor: c.warningBg },
    done: { backgroundColor: c.successBg },
    failed: { backgroundColor: c.dangerBg },
    count: { fontSize: 11, fontWeight: '700', color: c.warning },
    failedText: { color: c.danger },
})
