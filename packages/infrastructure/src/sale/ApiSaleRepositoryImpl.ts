import { IApiSaleRepository, VentaBatchRequest, VentaBatchResponse, ProductoConStockResponse } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiSaleRepositoryImpl implements IApiSaleRepository {
    constructor(private http: ApiHttpClient) {}

    async registrarVentaBatch(request: VentaBatchRequest): Promise<VentaBatchResponse> {
        // Sin normalizar: SaleService valida clientId y arreglos; rellenar con defaults
        // ocultaria una respuesta vacia o incompleta.
        return this.http.post<VentaBatchResponse>('/api/movimiento/venta/batch', request)
    }

    async buscarProductosConStock(q: string, sucursalId: number): Promise<ProductoConStockResponse[]> {
        return this.http.get<ProductoConStockResponse[]>(
            `/api/producto/buscar?q=${encodeURIComponent(q)}&sucursalId=${sucursalId}`
        )
    }
}
