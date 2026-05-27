import { posQuerySchema, posCantidadSchema, posMontoSchema } from '../posSchema'

describe('posQuerySchema', () => {
  test('accepts empty query', () => {
    expect(posQuerySchema.safeParse({ query: '' }).success).toBe(true)
  })

  test('trims query', () => {
    const result = posQuerySchema.safeParse({ query: '  laptop  ' })
    expect(result.success && result.data.query).toBe('laptop')
  })

  test('rejects query over 100 chars', () => {
    expect(posQuerySchema.safeParse({ query: 'a'.repeat(101) }).success).toBe(false)
  })
})

describe('posCantidadSchema', () => {
  test('accepts positive integer', () => {
    expect(posCantidadSchema.safeParse({ cantidad: '3' }).success).toBe(true)
  })

  test('rejects 0', () => {
    expect(posCantidadSchema.safeParse({ cantidad: '0' }).success).toBe(false)
  })

  test('rejects negative', () => {
    expect(posCantidadSchema.safeParse({ cantidad: '-1' }).success).toBe(false)
  })

  test('rejects decimal', () => {
    expect(posCantidadSchema.safeParse({ cantidad: '1.5' }).success).toBe(false)
  })
})

describe('posMontoSchema', () => {
  test('accepts valid monto', () => {
    expect(posMontoSchema.safeParse({ montoRecibido: '150.00' }).success).toBe(true)
  })

  test('rejects 0', () => {
    expect(posMontoSchema.safeParse({ montoRecibido: '0' }).success).toBe(false)
  })

  test('rejects more than 2 decimals', () => {
    expect(posMontoSchema.safeParse({ montoRecibido: '10.999' }).success).toBe(false)
  })
})
