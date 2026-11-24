import { useSyncQueueStatus } from '@/src/utils/hooks/useSyncQueueStatus'
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
    ownerId?: string | null
}

export function SyncQueueBadge({ ownerId = null }: Props) {
    const { pendingCount, failedCount, isSyncing, retrying, retryFailed } = useSyncQueueStatus(ownerId)

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
                ? <ActivityIndicator size="small" color="#dc2626" />
                : <Ionicons name="alert-circle" size={14} color="#dc2626" />}
            <Text style={[styles.count, styles.failedText]}>{failedCount}</Text>
        </TouchableOpacity>
    ) : null

    let status: React.ReactNode
    if (isSyncing) {
        status = (
            <View style={[styles.badge, styles.syncing]}>
                <Ionicons name="sync" size={14} color="#2563eb" />
            </View>
        )
    } else if (pendingCount > 0) {
        status = (
            <View style={[styles.badge, styles.pending]}>
                <Ionicons name="time-outline" size={14} color="#d97706" />
                <Text style={styles.count}>{pendingCount}</Text>
            </View>
        )
    } else if (failedCount === 0) {
        status = (
            <View style={[styles.badge, styles.done]}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
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

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 12,
        gap: 3,
    },
    syncing: { backgroundColor: '#eff6ff' },
    pending: { backgroundColor: '#fffbeb' },
    done: { backgroundColor: '#ecfdf5' },
    failed: { backgroundColor: '#fef2f2' },
    count: { fontSize: 11, fontWeight: '700', color: '#d97706' },
    failedText: { color: '#dc2626' },
})
