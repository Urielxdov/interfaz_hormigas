import { usuarioSchema } from '../usuarioSchema'

describe('usuarioSchema', () => {
  const valid = {
    nombre: 'Juan García',
    correo: 'juan@empresa.com',
    password: 'Passw0rd',
    sucursalId: null,
  }

  test('accepts valid data', () => {
    expect(usuarioSchema.safeParse(valid).success).toBe(true)
  })

  test('lowercases correo', () => {
    const result = usuarioSchema.safeParse({ ...valid, correo: 'JUAN@EMPRESA.COM' })
    expect(result.success && result.data.correo).toBe('juan@empresa.com')
  })

  test('rejects nombre under 3 chars', () => {
    expect(usuarioSchema.safeParse({ ...valid, nombre: 'ab' }).success).toBe(false)
  })

  test('rejects nombre over 80 chars', () => {
    expect(usuarioSchema.safeParse({ ...valid, nombre: 'a'.repeat(81) }).success).toBe(false)
  })

  test('accepts nombre with accents', () => {
    expect(usuarioSchema.safeParse({ ...valid, nombre: 'José Ángel Núñez' }).success).toBe(true)
  })

  test('rejects correo over 120 chars', () => {
    const longEmail = 'a'.repeat(115) + '@b.com'
    expect(usuarioSchema.safeParse({ ...valid, correo: longEmail }).success).toBe(false)
  })

  test('rejects password without uppercase', () => {
    expect(usuarioSchema.safeParse({ ...valid, password: 'passw0rd' }).success).toBe(false)
  })

  test('rejects password without lowercase', () => {
    expect(usuarioSchema.safeParse({ ...valid, password: 'PASSW0RD' }).success).toBe(false)
  })

  test('rejects password without number', () => {
    expect(usuarioSchema.safeParse({ ...valid, password: 'Password' }).success).toBe(false)
  })

  test('accepts null sucursalId', () => {
    expect(usuarioSchema.safeParse({ ...valid, sucursalId: null }).success).toBe(true)
  })

  test('accepts positive integer sucursalId', () => {
    expect(usuarioSchema.safeParse({ ...valid, sucursalId: 3 }).success).toBe(true)
  })

  test('rejects negative sucursalId', () => {
    expect(usuarioSchema.safeParse({ ...valid, sucursalId: -1 }).success).toBe(false)
  })
})
