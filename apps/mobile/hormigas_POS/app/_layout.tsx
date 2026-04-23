import { AuthProvider, useAuth } from '@/context/AuthContext'
import { NetworkProvider } from '@/context/NetworkContext'
import { initDatabase } from '@/db/DataBase'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import '../global.css'

function Guard() {
  const { token, branchId, isLoading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) return
    const inPos = segments[0] === '(pos)'
    const inLogin = segments[0] === 'login'
    const inBranchSelect = segments[0] === 'branch-select'

    if (!token) {
      if (!inLogin) router.replace('/login')
    } else if (!branchId) {
      if (!inBranchSelect) router.replace('/branch-select')
    } else {
      if (!inPos) router.replace('/(pos)/sale')
    }
  }, [token, branchId, isLoading, segments])

  return <Slot />
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false)

  useEffect(() => {
    initDatabase().then(() => setDbReady(true)).catch(console.error)
  }, [])

  if (!dbReady) return <View className='flex-1 bg-white' />

  return (
    <NetworkProvider>
      <AuthProvider>
        <Guard />
      </AuthProvider>
    </NetworkProvider>
  )
}
