import { IApiBranchRepository, BranchItemListDTO, CreateBranchDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

type SucursalServerDTO = {
    id: number
    nombre: string
    direccion?: string
    activa: boolean
    encargadoId?: number
    encargadoNombre?: string
}

function toDTO(row: SucursalServerDTO): BranchItemListDTO {
    return {
        id: BigInt(row.id),
        nombre: row.nombre,
        direccion: row.direccion,
        responsable: row.encargadoNombre,
        encargadoId: row.encargadoId,
        activa: row.activa,
    }
}

export class ApiBranchRepositoryImpl implements IApiBranchRepository {
    constructor(private http: ApiHttpClient) {}

    async listar(): Promise<BranchItemListDTO[]> {
        const rows = await this.http.get<SucursalServerDTO[]>('/api/sucursal/listar')
        return rows.map(toDTO)
    }

    async crear(dto: CreateBranchDTO): Promise<BranchItemListDTO> {
        const row = await this.http.post<SucursalServerDTO>('/api/sucursal/crear', {
            nombre: dto.nombre,
            direccion: dto.direccion,
            encargadoId: dto.encargadoId ?? null,
        })
        return toDTO(row)
    }
}
