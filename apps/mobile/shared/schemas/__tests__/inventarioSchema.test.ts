import { inventarioSchema } from '../inventarioSchema'

describe('inventarioSchema', () => {
  const valid = { stockActual: '10', stockMinimo: '5', stockMaximo: '100' }

  test('accepts valid data', () => {
    expect(inventarioSchema.safeParse(valid).success).toBe(true)
  })

  test('rejects negative stockActual', () => {
    expect(inventarioSchema.safeParse({ ...valid, stockActual: '-1' }).success).toBe(false)
  })

  test('rejects non-integer stockActual', () => {
    expect(inventarioSchema.safeParse({ ...valid, stockActual: '5.5' }).success).toBe(false)
  })

  test('rejects negative stockMinimo', () => {
    expect(inventarioSchema.safeParse({ ...valid, stockMinimo: '-1' }).success).toBe(false)
  })

  test('rejects stockMaximo <= stockMinimo', () => {
    const result = inventarioSchema.safeParse({ ...valid, stockMinimo: '50', stockMaximo: '30' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('stockMaximo')
    }
  })

  test('accepts stockMinimo equal to 0', () => {
    expect(inventarioSchema.safeParse({ ...valid, stockMinimo: '0' }).success).toBe(true)
  })
})
