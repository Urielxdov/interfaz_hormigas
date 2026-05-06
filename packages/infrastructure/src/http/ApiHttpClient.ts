import { TokenService } from '@hormigas/application'

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message)
        this.name = 'HttpError'
    }
}

export class ApiHttpClient {
    constructor(
        private baseUrl: string,
        private tokenService: TokenService
    ) { }

    private async buildHeaders(): Promise<HeadersInit> {
        const token = await this.tokenService.getToken()

        console.log('[API][HEADERS] token exists:', !!token)

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        }

        if (token) {
            console.log('[API][HEADERS] token preview:', token.substring(0, 10))
            headers['Authorization'] = `Bearer ${token}`
        }

        console.log('[API][HEADERS] final:', headers)

        return headers
    }

    async get<T>(path: string): Promise<T> {
        console.log('[API][GET] url:', `${this.baseUrl}${path}`)

        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'GET',
            headers: await this.buildHeaders(),
        })

        console.log('[API][GET] status:', res.status)

        const data = await res.json().catch(() => null)

        console.log('[API][GET] response:', data)

        if (!res.ok) {
            console.log('[API][GET] ERROR:', data)
            throw new HttpError(res.status, `GET ${path} → ${res.status}`)
        }

        return data as T
    }

    async post<T>(path: string, body: unknown): Promise<T> {
        console.log('[API][POST] url:', `${this.baseUrl}${path}`)
        console.log('[API][POST] body:', body)

        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: await this.buildHeaders(),
            body: JSON.stringify(body),
        })

        console.log('[API][POST] status:', res.status)

        const data = await res.json().catch(() => null)

        console.log('[API][POST] response:', data)

        if (!res.ok) {
            console.log('[API][POST] ERROR:', data)
            throw new HttpError(res.status, `POST ${path} → ${res.status}`)
        }

        return data as T
    }

    async put<T>(path: string, body: unknown): Promise<T> {
        console.log('[API][PUT] url:', `${this.baseUrl}${path}`)
        console.log('[API][PUT] body:', body)

        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'PUT',
            headers: await this.buildHeaders(),
            body: JSON.stringify(body),
        })

        console.log('[API][PUT] status:', res.status)

        const data = await res.json().catch(() => null)

        console.log('[API][PUT] response:', data)

        if (!res.ok) {
            console.log('[API][PUT] ERROR:', data)
            throw new HttpError(res.status, `PUT ${path} → ${res.status}`)
        }

        return data as T
    }

    async delete(path: string): Promise<void> {
        console.log('[API][DELETE] url:', `${this.baseUrl}${path}`)

        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'DELETE',
            headers: await this.buildHeaders(),
        })

        console.log('[API][DELETE] status:', res.status)

        if (!res.ok) {
            const data = await res.json().catch(() => null)
            console.log('[API][DELETE] ERROR:', data)
            throw new HttpError(res.status, `DELETE ${path} → ${res.status}`)
        }

        console.log('[API][DELETE] success')
    }
}