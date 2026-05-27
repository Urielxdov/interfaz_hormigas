import { productoSchema } from '../productoSchema'

describe('productoSchema', () => {
  const valid = {
    nombre: 'Laptop Dell',
    sku: 'LAPTOP-001',
    precio: '1500.00',
    estado: true,
    control: false,
    categoriaId: 1,
  }

  test('accepts valid product without stock control', () => {
    expect(productoSchema.safeParse(valid).success).toBe(true)
  })

  test('uppercases sku', () => {
    const result = productoSchema.safeParse({ ...valid, sku: 'laptop-001' })
    expect(result.success && result.data.sku).toBe('LAPTOP-001')
  })

  test('rejects nombre under 2 chars', () => {
    expect(productoSchema.safeParse({ ...valid, nombre: 'L' }).success).toBe(false)
  })

  test('rejects nombre over 120 chars', () => {
    expect(productoSchema.safeParse({ ...valid, nombre: 'a'.repeat(121) }).success).toBe(false)
  })

  test('rejects sku under 3 chars', () => {
    expect(productoSchema.safeParse({ ...valid, sku: 'AB' }).success).toBe(false)
  })

  test('rejects sku over 40 chars', () => {
    expect(productoSchema.safeParse({ ...valid, sku: 'A'.repeat(41) }).success).toBe(false)
  })

  test('rejects sku with invalid chars', () => {
    expect(productoSchema.safeParse({ ...valid, sku: 'LAPTOP@001' }).success).toBe(false)
  })

  test('rejects precio 0 or negative', () => {
    expect(productoSchema.safeParse({ ...valid, precio: '0' }).success).toBe(false)
    expect(productoSchema.safeParse({ ...valid, precio: '-5' }).success).toBe(false)
  })

  test('rejects precio over 999999.99', () => {
    expect(productoSchema.safeParse({ ...valid, precio: '1000000' }).success).toBe(false)
  })

  test('rejects precio with more than 2 decimals', () => {
    expect(productoSchema.safeParse({ ...valid, precio: '10.999' }).success).toBe(false)
  })

  test('rejects missing categoriaId', () => {
    const { categoriaId: _, ...noCat } = valid
    expect(productoSchema.safeParse(noCat).success).toBe(false)
  })

  test('accepts valid product with stock control', () => {
    const withStock = { ...valid, control: true, stockMinimo: '5', stockMaximo: '100' }
    expect(productoSchema.safeParse(withStock).success).toBe(true)
  })

  test('rejects stockMaximo <= stockMinimo when control is true', () => {
    const bad = { ...valid, control: true, stockMinimo: '100', stockMaximo: '50' }
    const result = productoSchema.safeParse(bad)
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('stockMaximo')
    }
  })

  test('rejects negative stockMinimo', () => {
    const bad = { ...valid, control: true, stockMinimo: '-1', stockMaximo: '100' }
    expect(productoSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects stockMaximo over 999999', () => {
    const bad = { ...valid, control: true, stockMinimo: '0', stockMaximo: '1000000' }
    expect(productoSchema.safeParse(bad).success).toBe(false)
  })
})
