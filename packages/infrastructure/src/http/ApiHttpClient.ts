import { TokenService, NetworkError, InvalidResponseError } from '@hormigas/application'

// Definido por React Native / Metro; no existe en Node (tests).
declare const __DEV__: boolean | undefined

const isDev = (): boolean => typeof __DEV__ !== 'undefined' && !!__DEV__

function devLog(...args: unknown[]): void {
    if (isDev()) console.log(...args)
}

/** Tiempo maximo de espera por request antes de abortar (se trata como fallo de red). */
export const DEFAULT_HTTP_TIMEOUT_MS = 20_000

export class HttpError extends Error {
    constructor(public status: number, message: string, public body?: unknown) {
        super(message)
        this.name = 'HttpError'
    }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function errorMessage(data: unknown, fallback: string): string {
    if (data && typeof data === 'object') {
        const d = data as { error?: unknown; message?: unknown; mensaje?: unknown }
        for (const v of [d.error, d.message, d.mensaje]) {
            if (typeof v === 'string' && v.trim() !== '') return v
        }
    }
    return fallback
}

export class ApiHttpClient {
    constructor(
        private baseUrl: string,
        private tokenService: TokenService,
        private timeoutMs: number = DEFAULT_HTTP_TIMEOUT_MS,
        private fetchImpl: typeof fetch = (...args) => fetch(...args)
    ) { }

    private async buildHeaders(): Promise<Record<string, string>> {
        const token = await this.tokenService.getToken()
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        return headers
    }

    /**
     * Hace el request con timeout. Errores:
     * - NetworkError: sin red, servidor inalcanzable o timeout (no hubo respuesta HTTP).
     * - HttpError: respuesta HTTP no 2xx.
     * - InvalidResponseError: 2xx con cuerpo que no es JSON valido.
     * Un 2xx con cuerpo vacio devuelve null.
     */
    private async request<T>(method: Method, path: string, body?: unknown): Promise<T> {
        const url = `${this.baseUrl}${path}`
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
        let timedOut = false
        const timer = setTimeout(() => {
            timedOut = true
            controller?.abort()
        }, this.timeoutMs)

        devLog(`[API][${method}]`, path)

        let res: Response
        let text: string
        try {
            res = await this.fetchImpl(url, {
                method,
                headers: await this.buildHeaders(),
                body: body !== undefined ? JSON.stringify(body) : undefined,
                signal: controller?.signal,
            })
            text = await res.text()
        } catch (e) {
            if (timedOut) throw new NetworkError(`${method} ${path}: tiempo de espera agotado`, true)
            throw new NetworkError(`${method} ${path}: ${(e as Error)?.message ?? 'error de red'}`)
        } finally {
            clearTimeout(timer)
        }

        devLog(`[API][${method}]`, path, '->', res.status)

        let data: unknown = null
        let parseFailed = false
        if (text.trim() !== '') {
            try {
                data = JSON.parse(text)
            } catch {
                parseFailed = true
            }
        }

        if (!res.ok) {
            throw new HttpError(res.status, errorMessage(data, `${method} ${path} → ${res.status}`), data)
        }
        if (parseFailed) {
            throw new InvalidResponseError(`${method} ${path}: la respuesta no es JSON valido`, res.status)
        }
        return data as T
    }

    get<T>(path: string): Promise<T> {
        return this.request<T>('GET', path)
    }

    post<T>(path: string, body: unknown): Promise<T> {
        return this.request<T>('POST', path, body)
    }

    put<T>(path: string, body: unknown): Promise<T> {
        return this.request<T>('PUT', path, body)
    }

    patch<T = void>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('PATCH', path, body)
    }

    async delete(path: string): Promise<void> {
        await this.request<unknown>('DELETE', path)
    }
}
