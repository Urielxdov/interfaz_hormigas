import { usePOS, ProductWithStock } from '@/src/pos/hooks/usePOS'
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native'
import { useMemo, useState } from 'react'
import { posCantidadSchema, posMontoSchema } from '@hormigas/mobile-shared'
import { usePosSession } from '@/src/pos/context/PosSessionProvider'
import { SucursalPicker } from '@/src/pos/components/SucursalPicker'
import { PosColors, usePosColors } from '@/src/pos/theme'

export default function POSScreen() {
    const { sucursalId, ownerId, canChooseSucursal, setSucursalId } = usePosSession()
    const c = usePosColors()
    const styles = useMemo(() => makeStyles(c), [c])

    const {
        query, setQuery,
        results, searching,
        cart,
        addToCart, removeFromCart, updateCantidad,
        montoRecibido, setMontoRecibido,
        total, cambio,
        registering, registerSale,
        successMsg, errorMsg,
    } = usePOS(sucursalId, ownerId)

    const [quantities, setQuantities] = useState<Record<string, string>>({})
    const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>({})
    const [montoError, setMontoError] = useState<string | null>(null)

    const handleAdd = (product: ProductWithStock) => {
        const rawQty = quantities[product.productoLocalId] ?? '1'
        const qtyResult = posCantidadSchema.safeParse({ cantidad: rawQty })
        if (!qtyResult.success) {
            const err = qtyResult.error.flatten().fieldErrors.cantidad?.[0] ?? 'Cantidad inválida'
            setQuantityErrors(prev => ({ ...prev, [product.productoLocalId]: err }))
            return
        }
        setQuantityErrors(prev => ({ ...prev, [product.productoLocalId]: '' }))
        addToCart(product, parseInt(rawQty, 10))
        setQuantities(prev => ({ ...prev, [product.productoLocalId]: '1' }))
    }

    const handleRegisterSale = () => {
        const montoResult = posMontoSchema.safeParse({ montoRecibido })
        if (!montoResult.success) {
            setMontoError(montoResult.error.flatten().fieldErrors.montoRecibido?.[0] ?? 'Monto inválido')
            return
        }
        setMontoError(null)
        registerSale()
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                {canChooseSucursal ? (
                    <SucursalPicker value={sucursalId} onChange={setSucursalId} />
                ) : !sucursalId ? (
                    <View style={styles.notice}>
                        <Text style={styles.noticeText}>
                            Tu usuario no tiene una sucursal asignada. Pide a un administrador que te asigne una para poder vender.
                        </Text>
                    </View>
                ) : null}

                {/* Search */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Buscar producto</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre o SKU..."
                        placeholderTextColor={c.placeholder}
                        value={query}
                        onChangeText={setQuery}
                        maxLength={100}
                    />
                    {searching && <ActivityIndicator style={{ marginTop: 8 }} color={c.muted} />}
                    {results.map(p => (
                        <View key={p.productoLocalId}>
                            <View style={styles.resultRow}>
                                <View style={styles.resultInfo}>
                                    <Text style={styles.resultName}>{p.nombre}</Text>
                                    <Text style={styles.resultMeta}>
                                        {p.sku} · ${p.precio.toFixed(2)} · Stock: {p.stockActual}
                                    </Text>
                                </View>
                                <TextInput
                                    style={styles.qtyInput}
                                    keyboardType="numeric"
                                    value={quantities[p.productoLocalId] ?? '1'}
                                    onChangeText={v =>
                                        setQuantities(prev => ({ ...prev, [p.productoLocalId]: v }))
                                    }
                                />
                                <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(p)}>
                                    <Text style={styles.addBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                            {quantityErrors[p.productoLocalId] ? (
                                <Text style={styles.fieldError}>{quantityErrors[p.productoLocalId]}</Text>
                            ) : null}
                        </View>
                    ))}
                </View>

                {/* Cart */}
                {cart.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Carrito</Text>
                        {cart.map(item => (
                            <View key={item.productoLocalId} style={styles.cartRow}>
                                <View style={styles.cartInfo}>
                                    <Text style={styles.cartName}>{item.nombre}</Text>
                                    <Text style={styles.cartMeta}>${item.precio.toFixed(2)} c/u</Text>
                                </View>
                                <View style={styles.cartControls}>
                                    <TouchableOpacity
                                        style={styles.ctrlBtn}
                                        onPress={() => updateCantidad(item.productoLocalId, item.cantidad - 1)}
                                    >
                                        <Text style={styles.ctrlBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.ctrlQty}>{item.cantidad}</Text>
                                    <TouchableOpacity
                                        style={styles.ctrlBtn}
                                        onPress={() => updateCantidad(item.productoLocalId, item.cantidad + 1)}
                                    >
                                        <Text style={styles.ctrlBtnText}>+</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.cartSubtotal}>
                                        ${(item.precio * item.cantidad).toFixed(2)}
                                    </Text>
                                    <TouchableOpacity onPress={() => removeFromCart(item.productoLocalId)}>
                                        <Text style={styles.removeBtn}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Payment */}
                {cart.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cobro</Text>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Monto recibido"
                            placeholderTextColor={c.placeholder}
                            keyboardType="decimal-pad"
                            value={montoRecibido}
                            onChangeText={setMontoRecibido}
                        />
                        {parseFloat(montoRecibido) >= total && parseFloat(montoRecibido) > 0 && (
                            <View style={styles.cambioRow}>
                                <Text style={styles.cambioLabel}>Cambio</Text>
                                <Text style={styles.cambioAmount}>${cambio.toFixed(2)}</Text>
                            </View>
                        )}

                        {montoError ? <Text style={styles.error}>{montoError}</Text> : null}
                        {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
                        {successMsg && <Text style={styles.success}>{successMsg}</Text>}

                        <TouchableOpacity
                            style={[styles.saleBtn, registering && styles.saleBtnDisabled]}
                            onPress={handleRegisterSale}
                            disabled={registering}
                        >
                            {registering ? (
                                <ActivityIndicator color={c.onPrimary} />
                            ) : (
                                <Text style={styles.saleBtnText}>Registrar venta</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {cart.length === 0 && !query && (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Busca un producto para comenzar</Text>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const makeStyles = (c: PosColors) => StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.screen },
    container: { flex: 1, backgroundColor: c.screen },
    notice: { backgroundColor: c.warningBg, marginHorizontal: 12, marginTop: 12, borderRadius: 10, padding: 12 },
    noticeText: { color: c.warningText, fontSize: 13, textAlign: 'center' },
    section: {
        backgroundColor: c.card,
        margin: 12,
        borderRadius: 10,
        padding: 14,
        gap: 8,
    },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: c.textSecondary, marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 15,
        color: c.text,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: c.divider,
        gap: 8,
    },
    resultInfo: { flex: 1 },
    resultName: { fontSize: 14, fontWeight: '500', color: c.text },
    resultMeta: { fontSize: 12, color: c.muted, marginTop: 2 },
    qtyInput: {
        width: 44,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 6,
        textAlign: 'center',
        paddingVertical: 6,
        fontSize: 15,
        color: c.text,
    },
    addBtn: {
        backgroundColor: c.primary,
        borderRadius: 6,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtnText: { color: c.onPrimary, fontSize: 20, fontWeight: '600', lineHeight: 22 },
    cartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: c.divider,
        gap: 8,
    },
    cartInfo: { flex: 1 },
    cartName: { fontSize: 14, fontWeight: '500', color: c.text },
    cartMeta: { fontSize: 12, color: c.muted },
    cartControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ctrlBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: c.controlBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctrlBtnText: { fontSize: 16, fontWeight: '600', color: c.textSecondary },
    ctrlQty: { fontSize: 15, fontWeight: '600', minWidth: 22, textAlign: 'center', color: c.text },
    cartSubtotal: { fontSize: 14, fontWeight: '600', color: c.text, minWidth: 60, textAlign: 'right' },
    removeBtn: { color: c.danger, fontSize: 16, paddingLeft: 4 },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    totalLabel: { fontSize: 16, fontWeight: '600', color: c.textSecondary },
    totalAmount: { fontSize: 22, fontWeight: '700', color: c.text },
    cambioRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: c.successBg,
        borderRadius: 8,
        padding: 10,
    },
    cambioLabel: { fontSize: 15, fontWeight: '600', color: c.success },
    cambioAmount: { fontSize: 20, fontWeight: '700', color: c.success },
    fieldError: { color: c.danger, fontSize: 12, marginTop: 2 },
    error: { color: c.danger, fontSize: 13, textAlign: 'center' },
    success: { color: c.success, fontSize: 13, textAlign: 'center', fontWeight: '600' },
    saleBtn: {
        backgroundColor: c.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    saleBtnDisabled: { opacity: 0.6 },
    saleBtnText: { color: c.onPrimary, fontWeight: '700', fontSize: 16 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: c.faint, fontSize: 15 },
})
