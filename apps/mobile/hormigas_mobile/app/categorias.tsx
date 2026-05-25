import CategoriasScreen from '@/src/categorias/screens/CategoriasScreen'
import { Stack } from 'expo-router'

export default function CategoriasPage() {
    return (
        <>
            <Stack.Screen options={{ title: 'Categorías', headerShown: true }} />
            <CategoriasScreen />
        </>
    )
}
