import { useCallback, useEffect, useReducer, useState } from 'react'
import { CreateUsuarioDTO } from '@hormigas/application'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getUserRepos } from '@/src/adapters/userRepoInstance'
import { userReducer } from '@/src/utils/storage/user.reducer'

export function useUsuarios () {
  const [usuarios, dispatch] = useReducer(userReducer, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const { isOnline } = useNetwork()

  const loadLocal = useCallback(async () => {
    try {
      const { sqlite } = await getUserRepos()
      const data = await sqlite.findAll()
      dispatch({ type: 'SET', payload: data })
    } catch (e) {
      console.error('[useUsuarios] loadLocal:', e)
    }
  }, [])

  const syncFromServer = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { api, sqlite } = await getUserRepos()
      const data = await api.listarUsuarios()
      await sqlite.upsertMany(data)
      dispatch({ type: 'SET', payload: data })
    } catch (e) {
      setError('Error al cargar usuarios')
      console.error('[useUsuarios] syncFromServer:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLocal()
  }, [loadLocal])

  useEffect(() => {
    if (!isOnline) return
    syncFromServer()
  }, [isOnline, syncFromServer])

  const crear = async (dto: CreateUsuarioDTO) => {
    setCreating(true)
    try {
      const { api } = await getUserRepos()
      const nuevo = await api.crearUsuario(dto)
      dispatch({ type: 'CREATE', payload: nuevo })
      return nuevo
    } finally {
      setCreating(false)
    }
  }

  return { usuarios, loading, error, creating, crear, recargar: syncFromServer }
}
