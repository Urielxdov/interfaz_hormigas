import { useCallback, useEffect, useReducer, useState } from 'react'
import { Product } from '@hormigas/domain'
import { CreateProductDTO, ProductSyncResult, ProductService } from '@hormigas/application'
import { ProductViewModel } from '@/interfaces/Product'
import { getProductService } from '@/src/adapters/productServiceInstance'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { productReducer } from '../storage/product.reducer'

function mapToViewModel (product: Product): ProductViewModel {
  return {
    id: product.localId,
    serverId: product.serverId,
    nombre: product.nombre,
    sku: product.sku,
    categoria: product.categoria ?? '',
    categoriaId: product.categoriaId,
    precio: product.precio ?? 0,
    stock: product.stockTotal ?? 0,
    estado: product.activo,
    synced: product.synced ?? true,
    acciones: ' '
  }
}

/** Cambio rechazado por el servidor: se revierte con el valor del servidor y se informa. */
export class ProductRejectedError extends Error {}

export function useProducts () {
  const [products, dispatch] = useReducer(productReducer, [])
  const [syncing, setSyncing] = useState(false)
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

  /** Envia lo pendiente y baja el catalogo; devuelve lo que el servidor rechazo. */
  const syncNow = useCallback(async (svc?: ProductService): Promise<ProductSyncResult | null> => {
    const service = svc ?? await getProductService()
    setSyncing(true)
    try {
      const res = await service.syncPending()
      if (!res.interrupted) await service.pullFromServer()
      return res
    } catch (e) {
      console.warn('[useProducts] sync products:', e)
      return null
    } finally {
      setSyncing(false)
      await loadLocal()
    }
  }, [loadLocal])

  useEffect(() => {
    loadLocal()
  }, [loadLocal])

  useEffect(() => {
    if (!isOnline) return
    syncNow()
  }, [isOnline, syncNow])

  /** Con red el cambio se envia de inmediato y un rechazo se lanza como ProductRejectedError. */
  const pushAndCheck = async (svc: ProductService, localId?: string) => {
    if (!isOnline) {
      await loadLocal()
      return
    }
    const res = await syncNow(svc)
    const rejected = res?.failed.find(f => !localId || f.localId === localId)
    if (rejected) throw new ProductRejectedError(rejected.message)
  }

  const createProduct = async (dto: CreateProductDTO) => {
    const svc = await getProductService()
    const created = await svc.create(dto)
    await pushAndCheck(svc, created.localId)
  }

  const updateProduct = async (product: ProductViewModel) => {
    const svc = await getProductService()
    await svc.update({
      localId: product.id,
      nombre: product.nombre,
      sku: product.sku,
      categoria: product.categoria,
      categoriaId: product.categoriaId,
      precio: product.precio,
      activo: product.estado
    })
    await pushAndCheck(svc, product.id)
  }

  const toggleStatus = async (id: string) => {
    const svc = await getProductService()
    await svc.toggleActive(id)
    await pushAndCheck(svc, id)
  }

  return { products, syncing, createProduct, updateProduct, toggleStatus, refresh: syncNow }
}
