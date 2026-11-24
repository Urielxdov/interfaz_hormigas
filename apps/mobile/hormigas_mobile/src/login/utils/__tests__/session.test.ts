import { describe, it, expect } from '@jest/globals'
import {
    canAccess,
    decodeJWTPayload,
    getOwnerIdFromToken,
    getRoleFromToken,
    getRolesFromToken,
    getSucursalIdFromToken,
    homeRouteForRole,
    isTokenExpired,
    ROUTE_ACCESS,
} from '../session'

/** JWT sin firma valida (solo importa el payload), codificado en base64url sin padding. */
function jwt(payload: Record<string, unknown>): string {
    const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
    return `${enc({ alg: 'HS256' })}.${enc(payload)}.firma`
}

describe('decodeJWTPayload', () => {
    it('decodifica payloads base64url que necesitan padding', () => {
        // longitudes distintas para cubrir 0, 1 y 2 caracteres de padding
        for (const sub of ['a@x.mx', 'ab@x.mx', 'abc@x.mx']) {
            expect(decodeJWTPayload(jwt({ sub, n: 'ñ?>' }))).toMatchObject({ sub })
        }
    })

    it('devuelve {} con tokens corruptos', () => {
        expect(decodeJWTPayload('basura')).toEqual({})
        expect(decodeJWTPayload('a.%%%.b')).toEqual({})
    })
})

describe('roles', () => {
    it('lee el claim roles separado por espacios', () => {
        expect(getRolesFromToken(jwt({ roles: 'ROLE_USER  ROLE_ADMIN' }))).toEqual(['ROLE_USER', 'ROLE_ADMIN'])
        expect(getRolesFromToken(jwt({}))).toEqual([])
    })

    it('elige el rol de mayor privilegio', () => {
        expect(getRoleFromToken(jwt({ roles: 'ROLE_USER' }))).toBe('USER')
        expect(getRoleFromToken(jwt({ roles: 'ROLE_USER ROLE_ADMIN' }))).toBe('ADMIN')
        expect(getRoleFromToken(jwt({ roles: 'ROLE_ADMIN ROLE_SUPER_ADMIN' }))).toBe('SUPER_ADMIN')
    })

    it('sin roles conocidos se trata como cajero (menor privilegio)', () => {
        expect(getRoleFromToken(jwt({}))).toBe('USER')
        expect(getRoleFromToken(jwt({ roles: 'ROLE_OTRO' }))).toBe('USER')
    })

    it('cada rol aterriza en su pantalla', () => {
        expect(homeRouteForRole('USER')).toBe('/(pos)/venta')
        expect(homeRouteForRole('ADMIN')).toBe('/(tabs)/home')
        expect(homeRouteForRole('SUPER_ADMIN')).toBe('/(superadmin)')
    })

    it('el cajero no entra a las rutas de administracion', () => {
        expect(canAccess('USER', ROUTE_ACCESS.admin)).toBe(false)
        expect(canAccess('USER', ROUTE_ACCESS.superadmin)).toBe(false)
        expect(canAccess('USER', ROUTE_ACCESS.pos)).toBe(true)
        expect(canAccess('ADMIN', ROUTE_ACCESS.admin)).toBe(true)
        expect(canAccess('ADMIN', ROUTE_ACCESS.pos)).toBe(true)
        expect(canAccess('ADMIN', ROUTE_ACCESS.superadmin)).toBe(false)
        expect(canAccess('SUPER_ADMIN', ROUTE_ACCESS.superadmin)).toBe(true)
    })
})

describe('claims de sesion', () => {
    it('sucursalId solo si es numerico', () => {
        expect(getSucursalIdFromToken(jwt({ sucursalId: 3 }))).toBe(3)
        expect(getSucursalIdFromToken(jwt({ sucursalId: null }))).toBeNull()
        expect(getSucursalIdFromToken(jwt({ sucursalId: '3' }))).toBeNull()
    })

    it('ownerId es el claim sub', () => {
        expect(getOwnerIdFromToken(jwt({ sub: 'caja@x.mx' }))).toBe('caja@x.mx')
        expect(getOwnerIdFromToken(jwt({ sub: '' }))).toBeNull()
    })

    it('exp con margen de 30 s; sin exp se considera vigente', () => {
        const now = 1_700_000_000_000
        expect(isTokenExpired(jwt({ exp: now / 1000 + 3600 }), now)).toBe(false)
        expect(isTokenExpired(jwt({ exp: now / 1000 + 10 }), now)).toBe(true)
        expect(isTokenExpired(jwt({ exp: now / 1000 - 1 }), now)).toBe(true)
        expect(isTokenExpired(jwt({}), now)).toBe(false)
    })
})
