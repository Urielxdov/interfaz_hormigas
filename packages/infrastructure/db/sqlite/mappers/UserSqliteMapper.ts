/**
 * Conversion de entidad de domino a fila de SQLite
 */

import { User } from "packages/domain/entities/user/User"

export type UserRow = {
    id: string
    email: string
    name: string
    company_id: string
    status: number
    synced: number
    update_at: string
    password: string
}

export class UserSqliteMapper {
    static toDomain(row: UserRow): User {
        return {
            localId: row.id,
            correo: row.email,
            nombre: row.name,
            empresaId: row.company_id,
            activo: row.status === 1,
            passwordHash: row.password
        }
    }

    static toRow(user: User): UserRow {
        return {
            id: user.localId,
            email: user.correo,
            name: user.nombre,
            company_id: user.empresaId,
            password: user.passwordHash,
            status: user.activo ? 1 : 0,
            synced: 0,
            update_at: new Date().toISOString()
        }
    }
}