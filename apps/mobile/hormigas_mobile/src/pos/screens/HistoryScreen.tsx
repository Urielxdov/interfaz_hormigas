import { Sale } from '@hormigas/domain'
import { getSaleService } from '@/src/adapters/saleServiceInstance'
import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { PosColors, usePosColors } from '@/src/pos/theme'

export default function HistoryScreen() {
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)
    const c = usePosColors()
    const styles = useMemo(() => makeStyles(c), [c])

    // Recargar al volver a la pestaña (ventas nuevas y estado de sincronizacion).
    useFocusEffect(useCallback(() => {
        let active = true
        getSaleService()
            .then(svc => svc.getHistory())
            .then(data => { if (active) setSales(data) })
            .catch(e => console.warn('[POS] historial:', e))
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, []))

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={c.muted} />
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

const makeStyles = (c: PosColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screen, padding: 12 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.screen },
    emptyText: { color: c.faint, fontSize: 15 },
    card: {
        backgroundColor: c.card,
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardDate: { fontSize: 13, color: c.textSecondary },
    cardItems: { fontSize: 12, color: c.faint, marginTop: 2 },
    cardRight: { alignItems: 'flex-end' },
    cardTotal: { fontSize: 18, fontWeight: '700', color: c.text },
    synced: { fontSize: 11, color: c.success, marginTop: 2 },
    pending: { fontSize: 11, color: c.warning, marginTop: 2 },
    detail: { marginTop: 12, borderTopWidth: 1, borderTopColor: c.divider, paddingTop: 10, gap: 6 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailName: { flex: 1, fontSize: 13, color: c.textSecondary },
    detailQty: { fontSize: 13, color: c.muted, width: 32 },
    detailSubtotal: { fontSize: 13, fontWeight: '600', color: c.text, width: 60, textAlign: 'right' },
    detailFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: c.divider,
        paddingTop: 6,
        marginTop: 4,
    },
    detailLabel: { fontSize: 13, color: c.muted },
    detailValue: { fontSize: 13, fontWeight: '600', color: c.text },
})
