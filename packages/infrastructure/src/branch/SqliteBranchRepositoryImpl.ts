import { BranchItemListDTO, CreateBranchDTO } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'

type SucursalRow = {
    id: number
    nombre: string
    direccion: string | null
    activa: number
    empresa_id: number | null
}

function toDTO(row: SucursalRow): BranchItemListDTO {
    return {
        id: BigInt(row.id),
        nombre: row.nombre,
        direccion: row.direccion ?? undefined,
        responsable: '',
        activa: row.activa === 1,
    }
}

export class SqliteBranchRepositoryImpl {
    constructor(private db: DatabaseClient) {}

    async findAll(): Promise<BranchItemListDTO[]> {
        const rows = await this.db.getMany<SucursalRow>(
            'SELECT * FROM sucursal ORDER BY nombre ASC'
        )
        return rows.map(toDTO)
    }

    async upsertMany(items: BranchItemListDTO[]): Promise<void> {
        for (const item of items) {
            // Remove any locally-created row with same nombre and different id
            await this.db.run(
                'DELETE FROM sucursal WHERE LOWER(nombre) = LOWER(?) AND id != ?',
                [item.nombre, Number(item.id)]
            )
            await this.db.run(
                `INSERT OR REPLACE INTO sucursal (id, nombre, direccion, activa)
                 VALUES (?, ?, ?, ?)`,
                [
                    Number(item.id),
                    item.nombre,
                    item.direccion ?? null,
                    item.activa ? 1 : 0,
                ]
            )
        }
    }

    async findByNombre(nombre: string): Promise<BranchItemListDTO | null> {
        const row = await this.db.getOne<SucursalRow>(
            'SELECT * FROM sucursal WHERE LOWER(nombre) = LOWER(?)',
            [nombre]
        )
        return row ? toDTO(row) : null
    }

    async save(dto: CreateBranchDTO): Promise<BranchItemListDTO> {
        await this.db.run(
            `INSERT INTO sucursal (nombre, direccion, activa)
             VALUES (?, ?, ?)`,
            [dto.nombre, dto.direccion ?? null, dto.activa ? 1 : 0]
        )
        const row = await this.db.getOne<SucursalRow>(
            'SELECT * FROM sucursal WHERE nombre = ? ORDER BY id DESC LIMIT 1',
            [dto.nombre]
        )
        return toDTO(row!)
    }
}
