import { empresaSchema } from '../empresaSchema'

describe('empresaSchema', () => {
  const valid = {
    empresa: {
      nombre: 'Empresa Demo SA',
      rfc: 'EDM010101ABC',
      direccion: 'Av. Principal 123',
      telefono: '5551234567',
    },
    admin: {
      nombre: 'Admin Ejemplo',
      correo: 'admin@empresa.com',
      password: 'Passw0rd',
    },
  }

  test('accepts valid data', () => {
    expect(empresaSchema.safeParse(valid).success).toBe(true)
  })

  test('uppercases RFC', () => {
    const result = empresaSchema.safeParse({
      ...valid,
      empresa: { ...valid.empresa, rfc: 'edm010101abc' },
    })
    expect(result.success && result.data.empresa.rfc).toBe('EDM010101ABC')
  })

  test('rejects invalid RFC format', () => {
    const bad = { ...valid, empresa: { ...valid.empresa, rfc: 'INVALID' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('accepts 4-letter RFC prefix (persona física)', () => {
    const ok = { ...valid, empresa: { ...valid.empresa, rfc: 'ABCD010101ABC' } }
    expect(empresaSchema.safeParse(ok).success).toBe(true)
  })

  test('rejects empresa.nombre under 3 chars', () => {
    const bad = { ...valid, empresa: { ...valid.empresa, nombre: 'AB' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects empresa.nombre over 120 chars', () => {
    const bad = { ...valid, empresa: { ...valid.empresa, nombre: 'a'.repeat(121) } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects empresa.telefono with less than 10 digits', () => {
    const bad = { ...valid, empresa: { ...valid.empresa, telefono: '555123456' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects empresa.direccion over 250 chars', () => {
    const bad = { ...valid, empresa: { ...valid.empresa, direccion: 'a'.repeat(251) } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects admin.password without uppercase', () => {
    const bad = { ...valid, admin: { ...valid.admin, password: 'passw0rd' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects admin.correo with invalid format', () => {
    const bad = { ...valid, admin: { ...valid.admin, correo: 'notanemail' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects admin.nombre under 3 chars', () => {
    const bad = { ...valid, admin: { ...valid.admin, nombre: 'AB' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })
})
