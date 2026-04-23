import NetInfo from '@react-native-community/netinfo'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

const NetworkContext = createContext({ isOnline: true })

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true)
    })
    return unsub
  }, [])

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  )
}

export const useNetwork = () => useContext(NetworkContext)
