import { useCallback, useEffect, useMemo, useState } from 'react'
import { CategoriaDTO, NuevaCategoriaDTO } from '@hormigas/application'
import { getCategoriaRepo } from '@/src/adapters/categoriaServiceInstance'

const byNombre = (a: CategoriaDTO, b: CategoriaDTO) => a.nombre.localeCompare(b.nombre, 'es')

/**
 * Categorias de la empresa (activas e inactivas). `activas` es lo que se puede asignar
 * a un producto; `categorias` incluye las inactivas para la pantalla de gestion.
 */
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
            setCategorias((await repo.listar(true)).sort(byNombre))
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al cargar categorías')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { cargar() }, [cargar])

    const activas = useMemo(() => categorias.filter(c => c.activo), [categorias])

    const crear = async (dto: NuevaCategoriaDTO) => {
        setSaving(true)
        try {
            const nueva = await getCategoriaRepo().crear(dto)
            setCategorias(prev => [...prev, nueva].sort(byNombre))
            return nueva
        } finally {
            setSaving(false)
        }
    }

    const actualizar = async (id: number, dto: NuevaCategoriaDTO) => {
        setSaving(true)
        try {
            const updated = await getCategoriaRepo().actualizar(id, dto)
            setCategorias(prev => prev.map(c => c.id === id ? updated : c).sort(byNombre))
            return updated
        } finally {
            setSaving(false)
        }
    }

    const toggleActivo = async (id: number) => {
        const updated = await getCategoriaRepo().toggleActivo(id)
        setCategorias(prev => prev.map(c => c.id === id ? updated : c))
    }

    return { categorias, activas, loading, error, saving, crear, actualizar, toggleActivo, recargar: cargar }
}
