import { useCallback, useEffect, useState } from 'react'
import { MotivoDTO } from '@hormigas/application'
import { getMotivoRepo } from '@/src/adapters/motivoServiceInstance'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

export function useMotivo() {
  const [motivos, setMotivos] = useState<MotivoDTO[]>([])
  const { isOnline } = useNetwork()

  const load = useCallback(async () => {
    if (!isOnline) return
    try {
      const repo = await getMotivoRepo()
      const data = await repo.listar()
      setMotivos(data)
    } catch (e) {
      console.warn('[useMotivo]', e)
    }
  }, [isOnline])

  useEffect(() => { load() }, [load])

  return { motivos }
}
