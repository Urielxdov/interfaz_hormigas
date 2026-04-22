import { NetworkProvider } from '../../shared/context/NetworkContext'
import { Redirect } from 'expo-router'

export default function App () {
  return (
    <NetworkProvider>
      <Redirect href='/(login)' />
    </NetworkProvider>
  )
}
