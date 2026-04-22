import { useCallback, useEffect, useState } from 'react'
import { Product } from '@hormigas/domain'
import { CreateProductDTO } from '@hormigas/application'
import { ProductViewModel } from '@/interfaces/Product'
import { useNetwork } from '../../../../../shared/context/NetworkContext'
import { getProductService } from '@/src/adapters/productServiceInstance'

function mapToViewModel(product: Product): ProductViewModel {
    return {
        id: product.localId,
        nombre: product.nombre,
        sku: product.sku,
        categoria: product.categoria ?? '',
        precio: product.precio ?? 0,
        stock: 0,
        estado: product.activo,
        acciones: ' ',
    }
}

export function useProducts() {
    const [products, setProducts] = useState<ProductViewModel[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { isOnline } = useNetwork()

    const loadProducts = useCallback(async () => {
        setIsLoading(true)
        try {
            const svc = await getProductService()
            const domainProducts = await svc.findAll()
            setProducts(domainProducts.map(mapToViewModel))
        } catch (e) {
            console.error('[useProducts] loadProducts:', e)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadProducts()
    }, [loadProducts])

    useEffect(() => {
        if (!isOnline) return
        getProductService()
            .then(svc => svc.syncPending())
            .then(loadProducts)
            .catch(e => console.warn('[useProducts] syncPending:', e))
    }, [isOnline, loadProducts])

    const createProduct = async (dto: CreateProductDTO) => {
        const svc = await getProductService()
        await svc.create(dto)
        await loadProducts()
    }

    const updateProduct = async (product: ProductViewModel) => {
        const svc = await getProductService()
        await svc.update({
            localId: product.id,
            nombre: product.nombre,
            sku: product.sku,
            categoria: product.categoria,
            precio: product.precio,
            activo: product.estado,
        })
        await loadProducts()
    }

    const toggleStatus = async (id: string) => {
        const svc = await getProductService()
        await svc.toggleActive(id)
        await loadProducts()
    }

    return { products, isLoading, createProduct, updateProduct, toggleStatus }
}
