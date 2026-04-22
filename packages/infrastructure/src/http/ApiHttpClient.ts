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
    ) {}

    private async buildHeaders(): Promise<HeadersInit> {
        const token = await this.tokenService.getToken()
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        return headers
    }

    async get<T>(path: string): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'GET',
            headers: await this.buildHeaders(),
        })
        if (!res.ok) throw new HttpError(res.status, `GET ${path} → ${res.status}`)
        return res.json() as Promise<T>
    }

    async post<T>(path: string, body: unknown): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: await this.buildHeaders(),
            body: JSON.stringify(body),
        })
        if (!res.ok) throw new HttpError(res.status, `POST ${path} → ${res.status}`)
        return res.json() as Promise<T>
    }

    async put<T>(path: string, body: unknown): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'PUT',
            headers: await this.buildHeaders(),
            body: JSON.stringify(body),
        })
        if (!res.ok) throw new HttpError(res.status, `PUT ${path} → ${res.status}`)
        return res.json() as Promise<T>
    }

    async delete(path: string): Promise<void> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'DELETE',
            headers: await this.buildHeaders(),
        })
        if (!res.ok) throw new HttpError(res.status, `DELETE ${path} → ${res.status}`)
    }
}
