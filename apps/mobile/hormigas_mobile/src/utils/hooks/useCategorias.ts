import { useCallback, useEffect, useState } from 'react'
import { CategoriaDTO, NuevaCategoriaDTO } from '@hormigas/application'
import { getCategoriaRepo } from '@/src/adapters/categoriaServiceInstance'

export function useCategorias() {
    const [categorias, setCategorias] = useState<CategoriaDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const cargar = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const repo = getCategoriaRepo()
            setCategorias(await repo.listar())
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al cargar categorías')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { cargar() }, [cargar])

    const crear = async (dto: NuevaCategoriaDTO) => {
        setSaving(true)
        try {
            const repo = getCategoriaRepo()
            const nueva = await repo.crear(dto)
            setCategorias(prev => [...prev, nueva])
            return nueva
        } finally {
            setSaving(false)
        }
    }

    const toggleActivo = async (id: number) => {
        const repo = getCategoriaRepo()
        const updated = await repo.toggleActivo(id)
        setCategorias(prev => prev.map(c => c.id === id ? updated : c))
    }

    return { categorias, loading, error, saving, crear, toggleActivo, recargar: cargar }
}
