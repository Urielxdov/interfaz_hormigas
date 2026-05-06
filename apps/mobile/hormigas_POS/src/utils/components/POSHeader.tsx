import { SyncQueueBadge } from './SyncQueueBadge'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '@/src/auth/hooks/useAuth'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export function POSHeader() {
    const { logout } = useAuth()

    const handleLogout = async () => {
        await logout()
        router.replace('/(login)')
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Hormigas POS</Text>
            <View style={styles.right}>
                <SyncQueueBadge />
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: { fontSize: 17, fontWeight: '700', color: '#111' },
    right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoutBtn: { padding: 4 },
})
