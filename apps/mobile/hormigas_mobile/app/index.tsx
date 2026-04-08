import { useInitDatabase } from '@/src/utils/hooks/useInitDatabase'
import { NetworkProvider } from '../../shared/context/NetworkContext'
import { Redirect } from 'expo-router'
import { Text } from 'react-native'

export default function App() {
    const { isReady, error } = useInitDatabase()

    if(error) return <Text>Error iniciando la app</Text>
    if (!isReady) return <Text>Iniciando app</Text>

    return (
        <NetworkProvider>
            <Redirect href="/(login)" />
        </NetworkProvider>
    )
}