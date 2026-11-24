/**
 * Lectura del JWT de la sesion y reglas de enrutamiento por rol. Sin dependencias de
 * React Native para poder probarlo con Jest.
 */

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER'

export function decodeJWTPayload(token: string): Record<string, unknown> {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
        return JSON.parse(atob(padded))
    } catch {
        return {}
    }
}

/** Claim `roles`: cadena separada por espacios ("ROLE_USER ROLE_ADMIN"). */
export function getRolesFromToken(token: string): string[] {
    const roles = decodeJWTPayload(token)['roles']
    if (typeof roles !== 'string') return []
    return roles.split(/\s+/).filter(Boolean)
}

export function isSuperAdminToken(token: string): boolean {
    return getRolesFromToken(token).includes('ROLE_SUPER_ADMIN')
}

export function isAdminEmpresaToken(token: string): boolean {
    return getRolesFromToken(token).includes('ROLE_ADMIN')
}

/**
 * Rol efectivo de la app (el de mayor privilegio). Un token sin roles conocidos se trata
 * como USER (cajero): el rol con menos acceso.
 */
export function getRoleFromToken(token: string): AppRole {
    const roles = getRolesFromToken(token)
    if (roles.includes('ROLE_SUPER_ADMIN')) return 'SUPER_ADMIN'
    if (roles.includes('ROLE_ADMIN')) return 'ADMIN'
    return 'USER'
}

/** Pantalla de inicio de cada rol. */
export const HOME_ROUTE = {
    SUPER_ADMIN: '/(superadmin)',
    ADMIN: '/(tabs)/home',
    USER: '/(pos)/venta',
} as const satisfies Record<AppRole, string>

export type HomeRoute = (typeof HOME_ROUTE)[AppRole]

export function homeRouteForRole(role: AppRole): HomeRoute {
    return HOME_ROUTE[role]
}

/** Grupos de rutas y los roles que pueden entrar a cada uno. */
export const ROUTE_ACCESS = {
    admin: ['ADMIN', 'SUPER_ADMIN'],
    superadmin: ['SUPER_ADMIN'],
    pos: ['USER', 'ADMIN'],
} as const satisfies Record<string, readonly AppRole[]>

export function canAccess(role: AppRole, allowed: readonly AppRole[]): boolean {
    return allowed.includes(role)
}

export function getSucursalIdFromToken(token: string): number | null {
    const id = decodeJWTPayload(token)['sucursalId']
    return typeof id === 'number' ? id : null
}

/**
 * true si el JWT ya expiro (claim `exp`, en segundos). `skewSeconds` adelanta la expiracion
 * para no enviar un token que caduca a medio request. Sin `exp` se considera vigente.
 */
export function isTokenExpired(token: string, nowMs: number = Date.now(), skewSeconds = 30): boolean {
    const exp = decodeJWTPayload(token)['exp']
    if (typeof exp !== 'number') return false
    return exp * 1000 - skewSeconds * 1000 <= nowMs
}

/** Identificador del usuario de la sesion (claim `sub`, el correo). */
export function getOwnerIdFromToken(token: string): string | null {
    const sub = decodeJWTPayload(token)['sub']
    return typeof sub === 'string' && sub !== '' ? sub : null
}
