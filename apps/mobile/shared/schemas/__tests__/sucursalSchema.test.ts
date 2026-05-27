import { sucursalSchema } from '../sucursalSchema'

describe('sucursalSchema', () => {
  const valid = {
    nombre: 'Sucursal Centro',
    direccion: 'Av. Principal 123, Col. Centro',
    codigo: 'CENTRO-01',
    telefono: '5551234567',
    ciudad: 'Monterrey',
    encargadoId: null,
  }

  test('accepts valid data', () => {
    expect(sucursalSchema.safeParse(valid).success).toBe(true)
  })

  test('uppercases codigo', () => {
    const result = sucursalSchema.safeParse({ ...valid, codigo: 'centro-01' })
    expect(result.success && result.data.codigo).toBe('CENTRO-01')
  })

  test('rejects nombre under 3 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, nombre: 'ab' }).success).toBe(false)
  })

  test('rejects nombre over 60 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, nombre: 'a'.repeat(61) }).success).toBe(false)
  })

  test('rejects direccion under 10 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, direccion: 'Calle 1' }).success).toBe(false)
  })

  test('rejects direccion over 100 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, direccion: 'a'.repeat(101) }).success).toBe(false)
  })

  test('rejects codigo under 3 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, codigo: 'AB' }).success).toBe(false)
  })

  test('rejects codigo over 20 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, codigo: 'A'.repeat(21) }).success).toBe(false)
  })

  test('rejects codigo with invalid chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, codigo: 'CENTRO@01' }).success).toBe(false)
  })

  test('accepts codigo with _ and -', () => {
    expect(sucursalSchema.safeParse({ ...valid, codigo: 'CTR_01-A' }).success).toBe(true)
  })

  test('rejects telefono with letters', () => {
    expect(sucursalSchema.safeParse({ ...valid, telefono: '555abc4567' }).success).toBe(false)
  })

  test('rejects telefono with less than 10 digits', () => {
    expect(sucursalSchema.safeParse({ ...valid, telefono: '555123456' }).success).toBe(false)
  })

  test('rejects telefono with more than 10 digits', () => {
    expect(sucursalSchema.safeParse({ ...valid, telefono: '55512345678' }).success).toBe(false)
  })

  test('rejects ciudad over 60 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, ciudad: 'a'.repeat(61) }).success).toBe(false)
  })

  test('rejects ciudad with numbers', () => {
    expect(sucursalSchema.safeParse({ ...valid, ciudad: 'Monterrey123' }).success).toBe(false)
  })

  test('accepts null encargadoId', () => {
    expect(sucursalSchema.safeParse({ ...valid, encargadoId: null }).success).toBe(true)
  })
})
