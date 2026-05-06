import { usePOS, ProductWithStock } from '@/src/pos/hooks/usePOS'
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native'
import { useState } from 'react'

interface Props {
    token: string | null
}

export default function POSScreen({ token }: Props) {
    const {
        query, setQuery,
        results, searching,
        cart,
        addToCart, removeFromCart, updateCantidad,
        montoRecibido, setMontoRecibido,
        total, cambio,
        registering, registerSale,
        successMsg, errorMsg,
    } = usePOS(token)

    const [quantities, setQuantities] = useState<Record<string, string>>({})

    const handleAdd = (product: ProductWithStock) => {
        const q = parseInt(quantities[product.productoLocalId] ?? '1', 10)
        addToCart(product, isNaN(q) ? 1 : q)
        setQuantities(prev => ({ ...prev, [product.productoLocalId]: '1' }))
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                {/* Search */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Buscar producto</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre o SKU..."
                        value={query}
                        onChangeText={setQuery}
                    />
                    {searching && <ActivityIndicator style={{ marginTop: 8 }} />}
                    {results.map(p => (
                        <View key={p.productoLocalId} style={styles.resultRow}>
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

                        {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
                        {successMsg && <Text style={styles.success}>{successMsg}</Text>}

                        <TouchableOpacity
                            style={[styles.saleBtn, registering && styles.saleBtnDisabled]}
                            onPress={registerSale}
                            disabled={registering}
                        >
                            {registering ? (
                                <ActivityIndicator color="#fff" />
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

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: '#f9fafb' },
    section: {
        backgroundColor: '#fff',
        margin: 12,
        borderRadius: 10,
        padding: 14,
        gap: 8,
    },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 15,
        color: '#111',
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 8,
    },
    resultInfo: { flex: 1 },
    resultName: { fontSize: 14, fontWeight: '500', color: '#111' },
    resultMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    qtyInput: {
        width: 44,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        textAlign: 'center',
        paddingVertical: 6,
        fontSize: 15,
    },
    addBtn: {
        backgroundColor: '#111',
        borderRadius: 6,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtnText: { color: '#fff', fontSize: 20, fontWeight: '600', lineHeight: 22 },
    cartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 8,
    },
    cartInfo: { flex: 1 },
    cartName: { fontSize: 14, fontWeight: '500', color: '#111' },
    cartMeta: { fontSize: 12, color: '#6b7280' },
    cartControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ctrlBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctrlBtnText: { fontSize: 16, fontWeight: '600', color: '#374151' },
    ctrlQty: { fontSize: 15, fontWeight: '600', minWidth: 22, textAlign: 'center' },
    cartSubtotal: { fontSize: 14, fontWeight: '600', color: '#111', minWidth: 60, textAlign: 'right' },
    removeBtn: { color: '#ef4444', fontSize: 16, paddingLeft: 4 },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    totalLabel: { fontSize: 16, fontWeight: '600', color: '#374151' },
    totalAmount: { fontSize: 22, fontWeight: '700', color: '#111' },
    cambioRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        borderRadius: 8,
        padding: 10,
    },
    cambioLabel: { fontSize: 15, fontWeight: '600', color: '#059669' },
    cambioAmount: { fontSize: 20, fontWeight: '700', color: '#059669' },
    error: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
    success: { color: '#059669', fontSize: 13, textAlign: 'center', fontWeight: '600' },
    saleBtn: {
        backgroundColor: '#111',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    saleBtnDisabled: { opacity: 0.6 },
    saleBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#9ca3af', fontSize: 15 },
})
