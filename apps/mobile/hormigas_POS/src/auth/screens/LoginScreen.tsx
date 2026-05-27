import { useAuth } from '@/src/auth/hooks/useAuth'
import { router } from 'expo-router'
import { useState } from 'react'
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { loginSchema } from '@hormigas/mobile-shared'

export default function LoginScreen() {
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailError, setEmailError] = useState<string | null>(null)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [loginError, setLoginError] = useState<string | null>(null)

    const handleLogin = async () => {
        const result = loginSchema.safeParse({ email, password })
        if (!result.success) {
            const flat = result.error.flatten().fieldErrors
            setEmailError(flat.email?.[0] ?? null)
            setPasswordError(flat.password?.[0] ?? null)
            return
        }
        setEmailError(null)
        setPasswordError(null)
        setLoginError(null)
        setLoading(true)
        try {
            await login(result.data)
            router.replace('/(tabs)/pos')
        } catch {
            setLoginError('Credenciales incorrectas')
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.card}>
                <Text style={styles.title}>Hormigas POS</Text>
                <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

                <View>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
                </View>
                <View>
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
                </View>
                {loginError ? <Text style={styles.fieldError}>{loginError}</Text> : null}

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Iniciar sesión</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        gap: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111',
    },
    button: {
        backgroundColor: '#111',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    fieldError: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
})
