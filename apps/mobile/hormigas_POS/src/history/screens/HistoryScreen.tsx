import { Sale } from '@hormigas/domain'
import { getSaleService } from '@/src/adapters/saleServiceInstance'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

export default function HistoryScreen() {
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)

    useEffect(() => {
        getSaleService()
            .then(svc => svc.getHistory())
            .then(setSales)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    if (sales.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>Sin ventas registradas</Text>
            </View>
        )
    }

    return (
        <FlatList
            style={styles.container}
            data={sales}
            keyExtractor={item => item.localId}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => setExpanded(e => e === item.localId ? null : item.localId)}
                    activeOpacity={0.7}
                >
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardDate}>{new Date(item.fecha).toLocaleString()}</Text>
                            <Text style={styles.cardItems}>{item.items.length} producto(s)</Text>
                        </View>
                        <View style={styles.cardRight}>
                            <Text style={styles.cardTotal}>${item.total.toFixed(2)}</Text>
                            {item.sincronizado ? (
                                <Text style={styles.synced}>✓ Sync</Text>
                            ) : (
                                <Text style={styles.pending}>⏳ Pendiente</Text>
                            )}
                        </View>
                    </View>

                    {expanded === item.localId && (
                        <View style={styles.detail}>
                            {item.items.map((i, idx) => (
                                <View key={idx} style={styles.detailRow}>
                                    <Text style={styles.detailName}>{i.nombre}</Text>
                                    <Text style={styles.detailQty}>x{i.cantidad}</Text>
                                    <Text style={styles.detailSubtotal}>${i.subtotal.toFixed(2)}</Text>
                                </View>
                            ))}
                            <View style={styles.detailFooter}>
                                <Text style={styles.detailLabel}>Recibido</Text>
                                <Text style={styles.detailValue}>${item.montoRecibido.toFixed(2)}</Text>
                            </View>
                            <View style={styles.detailFooter}>
                                <Text style={styles.detailLabel}>Cambio</Text>
                                <Text style={styles.detailValue}>${item.cambio.toFixed(2)}</Text>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            )}
        />
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', padding: 12 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#9ca3af', fontSize: 15 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardDate: { fontSize: 13, color: '#374151' },
    cardItems: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    cardRight: { alignItems: 'flex-end' },
    cardTotal: { fontSize: 18, fontWeight: '700', color: '#111' },
    synced: { fontSize: 11, color: '#059669', marginTop: 2 },
    pending: { fontSize: 11, color: '#d97706', marginTop: 2 },
    detail: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, gap: 6 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailName: { flex: 1, fontSize: 13, color: '#374151' },
    detailQty: { fontSize: 13, color: '#6b7280', width: 32 },
    detailSubtotal: { fontSize: 13, fontWeight: '600', color: '#111', width: 60, textAlign: 'right' },
    detailFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 6,
        marginTop: 4,
    },
    detailLabel: { fontSize: 13, color: '#6b7280' },
    detailValue: { fontSize: 13, fontWeight: '600', color: '#111' },
})
