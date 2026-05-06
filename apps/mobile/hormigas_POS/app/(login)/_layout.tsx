import { Slot } from 'expo-router'
import { SafeAreaView, StyleSheet } from 'react-native'

export default function LoginLayout() {
    return (
        <SafeAreaView style={styles.container}>
            <Slot />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
})
