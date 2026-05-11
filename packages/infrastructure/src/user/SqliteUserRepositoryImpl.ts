import { UsuarioResponseDTO } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'

interface UsuarioRow {
    id: number
    nombre: string
    correo: string
    password_hash: string
    activo: number
    empresa_id: number
    fecha_creacion: string | null
    ultimo_acceso: string | null
}

export class SqliteUserRepositoryImpl {
    constructor(private db: DatabaseClient) {}

    async findAll(): Promise<UsuarioResponseDTO[]> {
        const rows = await this.db.getMany<UsuarioRow>('SELECT * FROM usuario')
        return rows.map((row) => ({
            id: row.id,
            name: row.nombre,
            correo: row.correo,
            empresaId: row.empresa_id,
            sucursalId: null,
            activo: row.activo === 1,
        }))
    }

    async upsertMany(users: UsuarioResponseDTO[]): Promise<void> {
        for (const user of users) {
            await this.db.run(
                'INSERT OR REPLACE INTO usuario (id, nombre, correo, password_hash, activo, empresa_id) VALUES (?, ?, ?, \'\', ?, ?)',
                [user.id, user.name, user.correo, user.activo ? 1 : 0, user.empresaId],
            )
        }
    }
}
