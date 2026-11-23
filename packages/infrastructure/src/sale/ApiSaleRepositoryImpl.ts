import { IApiSaleRepository, VentaBatchRequest, VentaBatchResponse, ProductoConStockResponse } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiSaleRepositoryImpl implements IApiSaleRepository {
    constructor(private http: ApiHttpClient) {}

    async registrarVentaBatch(request: VentaBatchRequest): Promise<VentaBatchResponse> {
        const res = await this.http.post<Partial<VentaBatchResponse> | null>('/api/movimiento/venta/batch', request)
        return {
            clientId: res?.clientId ?? null,
            duplicada: res?.duplicada ?? false,
            rechazados: res?.rechazados ?? [],
        }
    }

    async buscarProductosConStock(q: string, sucursalId: number): Promise<ProductoConStockResponse[]> {
        return this.http.get<ProductoConStockResponse[]>(
            `/api/producto/buscar?q=${encodeURIComponent(q)}&sucursalId=${sucursalId}`
        )
    }
}
