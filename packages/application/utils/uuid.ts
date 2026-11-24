type UUIDGenerator = () => string

let injected: UUIDGenerator | null = null

/**
 * Permite a la app inyectar un generador criptografico (p. ej. expo-crypto.randomUUID),
 * ya que Hermes no siempre expone crypto.randomUUID.
 */
export function setUUIDGenerator(fn: UUIDGenerator | null): void {
    injected = fn
}

function randomBytes(n: number): number[] {
    const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto
    if (c && typeof c.getRandomValues === 'function') {
        return Array.from(c.getRandomValues(new Uint8Array(n)))
    }
    // Ultimo recurso (tests / entornos sin crypto): no criptografico.
    return Array.from({ length: n }, () => Math.floor(Math.random() * 256))
}

export function generateUUID(): string {
    if (injected) return injected()
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
    if (c && typeof c.randomUUID === 'function') {
        return c.randomUUID()
    }
    const b = randomBytes(16)
    b[6] = (b[6] & 0x0f) | 0x40 // version 4
    b[8] = (b[8] & 0x3f) | 0x80 // variante RFC 4122
    const hex = b.map(x => x.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
