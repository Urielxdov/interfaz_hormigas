import { useSyncQueueStatus } from '@/src/utils/hooks/useSyncQueueStatus'
import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export function SyncQueueBadge() {
    const { pendingCount, isSyncing } = useSyncQueueStatus()

    if (isSyncing) {
        return (
            <View style={[styles.badge, styles.syncing]}>
                <Ionicons name="sync" size={14} color="#2563eb" />
            </View>
        )
    }

    if (pendingCount > 0) {
        return (
            <View style={[styles.badge, styles.pending]}>
                <Ionicons name="time-outline" size={14} color="#d97706" />
                <Text style={styles.count}>{pendingCount}</Text>
            </View>
        )
    }

    return (
        <View style={[styles.badge, styles.done]}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
        </View>
    )
}

const styles = StyleSheet.create({
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
    count: { fontSize: 11, fontWeight: '700', color: '#d97706' },
})
