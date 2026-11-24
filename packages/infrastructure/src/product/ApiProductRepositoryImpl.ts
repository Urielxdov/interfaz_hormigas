import { IApiProductRepository, ApiProductResponseDTO, NuevoProductoDTO, ActualizarProductoDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

type SpringPage<T> = {
    content: T[]
    totalPages: number
    totalElements: number
    number: number
    last?: boolean
}

const PAGE_SIZE = 200

export class ApiProductRepositoryImpl implements IApiProductRepository {
    constructor(private http: ApiHttpClient) {}

    async create(dto: NuevoProductoDTO): Promise<ApiProductResponseDTO> {
        return this.http.post<ApiProductResponseDTO>('/api/producto/nuevo', dto)
    }

    async update(serverId: number, dto: ActualizarProductoDTO): Promise<ApiProductResponseDTO> {
        return this.http.put<ApiProductResponseDTO>(`/api/producto/${serverId}`, dto)
    }

    /** Recorre todas las paginas (antes solo se bajaban los primeros 100). */
    async findAll(): Promise<ApiProductResponseDTO[]> {
        const all: ApiProductResponseDTO[] = []
        for (let page = 0; page < 100; page++) {
            const data = await this.http.get<SpringPage<ApiProductResponseDTO>>(
                `/api/producto/?todos=true&page=${page}&size=${PAGE_SIZE}&sort=nombre`
            )
            all.push(...(data.content ?? []))
            if (data.last ?? page + 1 >= data.totalPages) break
        }
        return all
    }
}
