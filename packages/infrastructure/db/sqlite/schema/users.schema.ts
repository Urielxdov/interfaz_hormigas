/**
 * Definiciones de tablas, nombre de columnas y queries base
 */

export const USERS_TABLE = 'users'

export const USER_COLUMNS = {
    id: 'id',
    name: 'nombre',
    email: 'correo',
    password: 'password_hash',
    status: 'activo',
    company: 'empresa_id',
    created: 'fecha_creacion',
    lastLogin: 'ultimo_acceso'
}