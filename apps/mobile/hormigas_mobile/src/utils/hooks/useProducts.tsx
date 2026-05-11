import { useCallback, useEffect, useReducer } from 'react'
import { Product } from '@hormigas/domain'
import { CreateProductDTO } from '@hormigas/application'
import { ProductViewModel } from '@/interfaces/Product'
import { getProductService } from '@/src/adapters/productServiceInstance'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { productReducer } from '../storage/product.reducer'

function mapToViewModel (product: Product): ProductViewModel {
  return {
    id: product.localId,
    nombre: product.nombre,
    sku: product.sku,
    categoria: product.categoria ?? '',
    precio: product.precio ?? 0,
    stock: 0,
    estado: product.activo,
    acciones: ' '
  }
}

export function useProducts () {
  const [products, dispatch] = useReducer(productReducer, [])
  const { isOnline } = useNetwork()

  const loadLocal = useCallback(async () => {
    try {
      const svc = await getProductService()
      const data = await svc.findAll()
      dispatch({ type: 'SET', payload: data.map(mapToViewModel) })
    } catch (e) {
      console.error('[useProducts] loadLocal:', e)
    }
  }, [])

  useEffect(() => {
    loadLocal()
  }, [loadLocal])

  useEffect(() => {
    if (!isOnline) return
    getProductService()
      .then(svc => svc.syncPending())
      .then(loadLocal)
      .catch(e => console.warn('[useProducts] syncPending:', e))
  }, [isOnline, loadLocal])

  const createProduct = async (dto: CreateProductDTO) => {
    const svc = await getProductService()
    await svc.create(dto)
    if (isOnline) await svc.syncPending()
    await loadLocal()
  }

  const updateProduct = async (product: ProductViewModel) => {
    const svc = await getProductService()
    await svc.update({
      localId: product.id,
      nombre: product.nombre,
      sku: product.sku,
      categoria: product.categoria,
      precio: product.precio,
      activo: product.estado
    })
    await loadLocal()
  }

  const toggleStatus = async (id: string) => {
    const svc = await getProductService()
    await svc.toggleActive(id)
    await loadLocal()
  }

  return { products, createProduct, updateProduct, toggleStatus }
}
