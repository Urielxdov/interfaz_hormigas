import { movimientoSchema } from '../movimientoSchema'

describe('movimientoSchema', () => {
  const valid = { cantidad: '5', referencia: '' }

  test('accepts valid data', () => {
    expect(movimientoSchema.safeParse(valid).success).toBe(true)
  })

  test('rejects cantidad 0', () => {
    expect(movimientoSchema.safeParse({ ...valid, cantidad: '0' }).success).toBe(false)
  })

  test('rejects negative cantidad', () => {
    expect(movimientoSchema.safeParse({ ...valid, cantidad: '-1' }).success).toBe(false)
  })

  test('rejects decimal cantidad', () => {
    expect(movimientoSchema.safeParse({ ...valid, cantidad: '5.5' }).success).toBe(false)
  })

  test('accepts empty referencia (optional)', () => {
    expect(movimientoSchema.safeParse({ ...valid, referencia: '' }).success).toBe(true)
  })

  test('rejects referencia over 100 chars', () => {
    expect(movimientoSchema.safeParse({ ...valid, referencia: 'a'.repeat(101) }).success).toBe(false)
  })

  test('rejects referencia with invalid chars', () => {
    expect(movimientoSchema.safeParse({ ...valid, referencia: 'ref@inválida!' }).success).toBe(false)
  })

  test('accepts referencia with allowed chars', () => {
    expect(movimientoSchema.safeParse({ ...valid, referencia: 'ticket-001 #abc_xyz.2' }).success).toBe(true)
  })
})
