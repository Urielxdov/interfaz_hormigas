import { ApiHttpClient, HttpError } from '../ApiHttpClient'
import { NetworkError, InvalidResponseError } from '../../../../application/errors/NetworkError'
import type { TokenService } from '../../../../application/port/token.port'

const tokenService: TokenService = {
    saveToken: async () => {},
    getToken: async () => 'header.payload.firma-secreta',
    saveRefreshToken: async () => {},
    getRefreshToken: async () => null,
    clearTokens: async () => {},
}

const response = (status: number, body: string) =>
    ({ ok: status >= 200 && status < 300, status, text: async () => body }) as unknown as Response

function client(fetchImpl: (url: string, init?: RequestInit) => Promise<Response>, timeoutMs = 1000) {
    return new ApiHttpClient('http://api', tokenService, timeoutMs, fetchImpl as typeof fetch)
}

describe('ApiHttpClient', () => {
    it('envia el token y devuelve el JSON', async () => {
        let headers: Record<string, string> = {}
        const http = client(async (_url, init) => {
            headers = init!.headers as Record<string, string>
            return response(200, '{"ok":true}')
        })
        await expect(http.get('/x')).resolves.toEqual({ ok: true })
        expect(headers.Authorization).toBe('Bearer header.payload.firma-secreta')
    })

    it('200 con cuerpo no-JSON -> InvalidResponseError (no se trata como exito)', async () => {
        const http = client(async () => response(200, '<html>proxy</html>'))
        await expect(http.post('/venta', {})).rejects.toBeInstanceOf(InvalidResponseError)
    })

    it('2xx con cuerpo vacio -> null', async () => {
        const http = client(async () => response(200, ''))
        await expect(http.patch('/x')).resolves.toBeNull()
    })

    it('error HTTP conserva status y mensaje del backend', async () => {
        const http = client(async () => response(500, '{"error":"Error interno del servidor"}'))
        const err: any = await http.get('/x').catch((e: any) => e)
        expect(err).toBeInstanceOf(HttpError)
        expect(err.status).toBe(500)
        expect(err.message).toBe('Error interno del servidor')
    })

    it('error HTTP con cuerpo no-JSON sigue siendo HttpError', async () => {
        const http = client(async () => response(502, 'Bad Gateway'))
        await expect(http.get('/x')).rejects.toMatchObject({ status: 502 })
    })

    it('fallo de fetch -> NetworkError', async () => {
        const http = client(async () => { throw new TypeError('Network request failed') })
        const err: any = await http.get('/x').catch((e: any) => e)
        expect(err).toBeInstanceOf(NetworkError)
        expect(err.timeout).toBe(false)
    })

    it('timeout -> NetworkError con timeout=true (aborta el request)', async () => {
        let aborted = false
        const http = client((_url, init) => new Promise((_res, rej) => {
            init!.signal!.addEventListener('abort', () => {
                aborted = true
                rej(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
            })
        }), 20)
        const err: any = await http.post('/venta', {}).catch((e: any) => e)
        expect(aborted).toBe(true)
        expect(err).toBeInstanceOf(NetworkError)
        expect(err.timeout).toBe(true)
    })

    it('no escribe el token en los logs', async () => {
        const log = jest.spyOn(console, 'log').mockImplementation(() => {})
        const http = client(async () => response(200, '{}'))
        await http.post('/x', { secreto: 1 })
        const printed = log.mock.calls.flat().map(String).join(' ')
        expect(printed).not.toContain('firma-secreta')
        log.mockRestore()
    })
})
