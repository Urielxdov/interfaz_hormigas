import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useInitDatabase } from '@/src/utils/hooks/useInitDatabase'
import { Text, View, StyleSheet } from 'react-native'
import 'react-native-reanimated'

export default function RootLayout() {
    const { isReady, error } = useInitDatabase()

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Error al iniciar la base de datos</Text>
            </View>
        )
    }

    if (!isReady) return null

    return (
        <SafeAreaProvider>
            <Stack>
                <Stack.Screen name="(login)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ef4444', fontSize: 15 },
})
