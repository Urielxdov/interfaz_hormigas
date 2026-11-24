import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { PosColors, usePosColors } from '@/src/pos/theme'

interface Props {
    value: number
    onChange: (sucursalId: number) => void
}

/** Selector de sucursal del POS para un ADMIN cuyo token no trae sucursal. */
export function SucursalPicker({ value, onChange }: Props) {
    const { branches } = useBranches()
    const c = usePosColors()
    const styles = useMemo(() => makeStyles(c), [c])
    const activas = branches.filter(b => b.activa)

    return (
        <View style={styles.section}>
            <Text style={styles.title}>Sucursal de venta</Text>
            {activas.length === 0 ? (
                <Text style={styles.empty}>
                    No hay sucursales cargadas. Abre la pestaña de sucursales con conexión para descargarlas.
                </Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                    {activas.map(b => {
                        const id = Number(b.id)
                        const selected = id === value
                        return (
                            <TouchableOpacity
                                key={id}
                                onPress={() => onChange(id)}
                                style={[styles.chip, selected && styles.chipSelected]}
                                accessibilityState={{ selected }}
                            >
                                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{b.nombre}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            )}
        </View>
    )
}

const makeStyles = (c: PosColors) => StyleSheet.create({
    section: { backgroundColor: c.card, marginHorizontal: 12, marginTop: 12, borderRadius: 10, padding: 14, gap: 8 },
    title: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
    empty: { fontSize: 13, color: c.muted },
    row: { gap: 8 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.controlBg,
    },
    chipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontSize: 13, color: c.textSecondary },
    chipTextSelected: { color: c.onPrimary, fontWeight: '600' },
})
