import NetInfo from '@react-native-community/netinfo'
import { createContext, useContext, useEffect, useState } from "react"

interface NetworkContextType {
    isOnline: boolean
}

const NetworkContext = createContext<NetworkContextType>({ isOnline: true })

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(!!state.isConnected)
        })
        return unsubscribe
    }, [])

    return (
        <NetworkContext.Provider value={{ isOnline }}>
            {children}
        </NetworkContext.Provider>
    )
}

export const useNetwork = () => useContext(NetworkContext)
