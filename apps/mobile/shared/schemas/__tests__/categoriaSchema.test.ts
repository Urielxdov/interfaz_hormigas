import { categoriaSchema } from '../categoriaSchema'

describe('categoriaSchema', () => {
  const valid = { nombre: 'Electrónica', descripcion: '' }

  test('accepts valid data', () => {
    expect(categoriaSchema.safeParse(valid).success).toBe(true)
  })

  test('trims nombre', () => {
    const result = categoriaSchema.safeParse({ ...valid, nombre: '  Electrónica  ' })
    expect(result.success && result.data.nombre).toBe('Electrónica')
  })

  test('rejects nombre under 3 chars', () => {
    expect(categoriaSchema.safeParse({ ...valid, nombre: 'AB' }).success).toBe(false)
  })

  test('rejects nombre over 50 chars', () => {
    expect(categoriaSchema.safeParse({ ...valid, nombre: 'a'.repeat(51) }).success).toBe(false)
  })

  test('accepts empty descripcion (optional)', () => {
    expect(categoriaSchema.safeParse({ ...valid, descripcion: '' }).success).toBe(true)
  })

  test('rejects descripcion over 200 chars', () => {
    expect(categoriaSchema.safeParse({ ...valid, descripcion: 'a'.repeat(201) }).success).toBe(false)
  })

  test('rejects descripcion with HTML tags', () => {
    expect(categoriaSchema.safeParse({ ...valid, descripcion: '<script>alert(1)</script>' }).success).toBe(false)
  })

  test('accepts descripcion with special chars but no HTML', () => {
    expect(categoriaSchema.safeParse({ ...valid, descripcion: 'Producto & más...' }).success).toBe(true)
  })

  test('rejects nombre of only spaces', () => {
    expect(categoriaSchema.safeParse({ ...valid, nombre: '     ' }).success).toBe(false)
  })

  test('rejects padded short nombre after trim', () => {
    expect(categoriaSchema.safeParse({ ...valid, nombre: '  ab  ' }).success).toBe(false)
  })

  test('collapses repeated spaces', () => {
    const result = categoriaSchema.safeParse({ ...valid, nombre: 'Frutas   y   verduras' })
    expect(result.success && result.data.nombre).toBe('Frutas y verduras')
  })

  test('rejects characters the server does not accept', () => {
    expect(categoriaSchema.safeParse({ ...valid, nombre: 'Bebidas!' }).success).toBe(false)
    expect(categoriaSchema.safeParse({ ...valid, nombre: 'Limpieza & Hogar' }).success).toBe(true)
  })
})
