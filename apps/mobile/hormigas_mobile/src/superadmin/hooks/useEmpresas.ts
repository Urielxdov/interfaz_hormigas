import { useEffect, useState } from 'react'
import { ApiEmpresaRepositoryImpl, ApiHttpClient, TokenServiceImpl } from '@hormigas/infrastructure'
import { EmpresaResponseDTO, CreateEmpresaDTO } from '@hormigas/application'
import { storage } from '@/src/adapters/AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

function getRepo() {
    const tokenService = new TokenServiceImpl(storage)
    const http = new ApiHttpClient(API_URL, tokenService)
    return new ApiEmpresaRepositoryImpl(http)
}

export function useEmpresas() {
    const [empresas, setEmpresas] = useState<EmpresaResponseDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const cargar = async () => {
        setLoading(true)
        setError(null)
        try {
            setEmpresas(await getRepo().listarTodas())
        } catch {
            setError('Error al cargar empresas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const crear = async (dto: CreateEmpresaDTO) => {
        setSaving(true)
        try {
            const nueva = await getRepo().crear(dto)
            setEmpresas(prev => [...prev, nueva])
            return nueva
        } finally {
            setSaving(false)
        }
    }

    const toggleActivo = async (empresa: EmpresaResponseDTO) => {
        const repo = getRepo()
        if (empresa.activo) {
            await repo.desactivar(empresa.id)
        } else {
            await repo.activar(empresa.id)
        }
        setEmpresas(prev =>
            prev.map(e => e.id === empresa.id ? { ...e, activo: !e.activo } : e)
        )
    }

    return { empresas, loading, error, saving, crear, toggleActivo, recargar: cargar }
}
