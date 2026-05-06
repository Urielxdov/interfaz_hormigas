import { IApiSaleRepository, VentaBatchRequest, ProductoConStockResponse } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiSaleRepositoryImpl implements IApiSaleRepository {
    constructor(private http: ApiHttpClient) {}

    async registrarVentaBatch(request: VentaBatchRequest): Promise<void> {
        await this.http.post<void>('/api/movimiento/venta/batch', request)
    }

    async buscarProductosConStock(q: string, sucursalId: number): Promise<ProductoConStockResponse[]> {
        return this.http.get<ProductoConStockResponse[]>(
            `/api/producto/buscar?q=${encodeURIComponent(q)}&sucursalId=${sucursalId}`
        )
    }
}
