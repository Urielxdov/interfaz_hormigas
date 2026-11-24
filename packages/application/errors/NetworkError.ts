/**
 * Fallo de red: el request no llego al servidor o no hubo respuesta a tiempo
 * (sin conexion, DNS, conexion rechazada, timeout). No es culpa de los datos:
 * la sincronizacion se interrumpe sin gastar intentos.
 */
export class NetworkError extends Error {
    readonly isNetworkError = true
    constructor(message = 'Sin conexion con el servidor', public readonly timeout = false) {
        super(message)
        this.name = 'NetworkError'
    }
}

/** El servidor respondio 2xx pero el cuerpo no es JSON valido o no tiene la forma esperada. */
export class InvalidResponseError extends Error {
    readonly isInvalidResponse = true
    constructor(message = 'Respuesta invalida del servidor', public readonly status?: number) {
        super(message)
        this.name = 'InvalidResponseError'
    }
}

/** Duck typing: el error puede venir de otra copia del modulo (bundles distintos). */
export function isNetworkError(e: unknown): boolean {
    return e instanceof NetworkError
        || (typeof e === 'object' && e !== null && (e as { isNetworkError?: unknown }).isNetworkError === true)
}

export function isInvalidResponseError(e: unknown): boolean {
    return e instanceof InvalidResponseError
        || (typeof e === 'object' && e !== null && (e as { isInvalidResponse?: unknown }).isInvalidResponse === true)
}
