import { useEffect, useState } from 'react'
import { ApiHttpClient, ApiUserRepositoryImpl, TokenServiceImpl } from '@hormigas/infrastructure'
import { UsuarioResponseDTO, CreateUsuarioDTO } from '@hormigas/application'
import { storage } from '@/src/adapters/AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

function getRepo() {
    const tokenService = new TokenServiceImpl(storage)
    const http = new ApiHttpClient(API_URL, tokenService)
    return new ApiUserRepositoryImpl(http)
}

export function useUsuarios() {
    const [usuarios, setUsuarios] = useState<UsuarioResponseDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [creating, setCreating] = useState(false)

    const cargar = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getRepo().listarUsuarios()
            setUsuarios(data)
        } catch (e) {
            setError('Error al cargar usuarios')
            console.error('[Usuarios] cargar:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const crear = async (dto: CreateUsuarioDTO) => {
        setCreating(true)
        try {
            const nuevo = await getRepo().crearUsuario(dto)
            setUsuarios(prev => [...prev, nuevo])
            return nuevo
        } finally {
            setCreating(false)
        }
    }

    return { usuarios, loading, error, creating, crear, recargar: cargar }
}
