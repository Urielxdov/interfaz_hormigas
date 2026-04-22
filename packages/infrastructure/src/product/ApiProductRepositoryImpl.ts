import { IApiProductRepository, ApiProductResponseDTO, NuevoProductoDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

type SpringPage<T> = {
    content: T[]
    totalPages: number
    totalElements: number
    number: number
}

export class ApiProductRepositoryImpl implements IApiProductRepository {
    constructor(private http: ApiHttpClient) {}

    async create(dto: NuevoProductoDTO): Promise<ApiProductResponseDTO> {
        return this.http.post<ApiProductResponseDTO>('/api/producto/nuevo', dto)
    }

    async findAll(page = 0, size = 100): Promise<ApiProductResponseDTO[]> {
        const data = await this.http.get<SpringPage<ApiProductResponseDTO>>(
            `/api/producto/?page=${page}&size=${size}`
        )
        return data.content
    }
}
