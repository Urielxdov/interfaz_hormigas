import { StorageAdapter } from '@/src/adapters/AsyncStorageAdapter'
import { UserRequestDTO, UserServiceImpl, UserTokenDTO } from '@hormigas/core'
import { useState } from 'react'

const service = new UserServiceImpl()
const storage = new StorageAdapter()

export default function useLogin () {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const dto: UserRequestDTO = { email, password }
      const user: UserTokenDTO = await service.login(dto)
      console.log(user.token)
      storage.setItem('Authorization', `Bearer ${user.token}`)
    } catch (e) {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, password, setPassword, loading, error, handleLogin }
}
