import POSScreen from '@/src/pos/screens/POSScreen'
import { useAuth } from '@/src/auth/hooks/useAuth'

export default function POSRoute() {
    const { token } = useAuth()
    return <POSScreen token={token} />
}
