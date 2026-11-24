import { SyncQueueBadge } from './SyncQueueBadge'
import { useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { getOwnerIdFromToken, useAuth } from '@/src/auth/hooks/useAuth'
import { getSaleService } from '@/src/adapters/saleServiceInstance'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const ventas = (n: number) => `${n} venta${n !== 1 ? 's' : ''}`

export function POSHeader() {
    const { token, logout } = useAuth()
    const ownerId = token ? getOwnerIdFromToken(token) : null
    const [busy, setBusy] = useState(false)

    const doLogout = async () => {
        await logout()
        router.replace('/(login)')
    }

    const countPending = async (): Promise<number> => {
        const svc = await getSaleService()
        const { pending } = await svc.getQueueCounts(ownerId)
        return pending
    }

    const syncThenLogout = async () => {
        setBusy(true)
        try {
            const svc = await getSaleService()
            await svc.syncPending({ ownerId })
            const remaining = await countPending()
            if (remaining === 0) {
                await doLogout()
                return
            }
            Alert.alert(
                'No se enviaron todas las ventas',
                `Quedan ${ventas(remaining)} sin sincronizar. Se enviarán cuando este usuario vuelva a iniciar sesión.`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Salir de todos modos', style: 'destructive', onPress: () => { doLogout() } },
                ]
            )
        } catch (e) {
            console.warn('[POS] sync antes de cerrar sesión falló:', e)
            Alert.alert('Error', 'No se pudo sincronizar. Intenta de nuevo.')
        } finally {
            setBusy(false)
        }
    }

    const handleLogout = async () => {
        let pending = 0
        try {
            pending = await countPending()
        } catch (e) {
            console.warn('[POS] no se pudo leer la cola:', e)
        }
        if (pending === 0) {
            await doLogout()
            return
        }

        const net = await NetInfo.fetch()
        const online = !!net.isConnected && net.isInternetReachable !== false
        if (!online) {
            Alert.alert(
                'Ventas sin enviar',
                `Hay ${ventas(pending)} sin sincronizar y no hay conexión. Conéctate a internet para enviarlas antes de cerrar sesión.`
            )
            return
        }

        Alert.alert(
            'Ventas sin enviar',
            `Hay ${ventas(pending)} sin sincronizar. ¿Enviarlas antes de cerrar sesión?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir sin enviar', style: 'destructive', onPress: () => { doLogout() } },
                { text: 'Sincronizar y salir', onPress: () => { syncThenLogout() } },
            ]
        )
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Hormigas POS</Text>
            <View style={styles.right}>
                <SyncQueueBadge ownerId={ownerId} />
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} disabled={busy}>
                    {busy
                        ? <ActivityIndicator size="small" color="#6b7280" />
                        : <Ionicons name="log-out-outline" size={20} color="#6b7280" />}
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
