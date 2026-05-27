import { loginSchema } from '../loginSchema'

describe('loginSchema', () => {
  const valid = { email: 'test@example.com', password: 'Password1' }

  test('accepts valid data', () => {
    expect(loginSchema.safeParse(valid).success).toBe(true)
  })

  test('lowercases email on output', () => {
    const result = loginSchema.safeParse({ ...valid, email: 'TEST@EXAMPLE.COM' })
    expect(result.success && result.data.email).toBe('test@example.com')
  })

  test('rejects missing email', () => {
    expect(loginSchema.safeParse({ ...valid, email: '' }).success).toBe(false)
  })

  test('rejects invalid email format', () => {
    expect(loginSchema.safeParse({ ...valid, email: 'notanemail' }).success).toBe(false)
  })

  test('rejects email over 120 chars', () => {
    const longEmail = 'a'.repeat(115) + '@b.com'
    expect(loginSchema.safeParse({ ...valid, email: longEmail }).success).toBe(false)
  })

  test('rejects password under 8 chars', () => {
    expect(loginSchema.safeParse({ ...valid, password: 'Pass1' }).success).toBe(false)
  })

  test('rejects password over 64 chars', () => {
    expect(loginSchema.safeParse({ ...valid, password: 'Passw0rd' + 'a'.repeat(60) }).success).toBe(false)
  })

  test('rejects password without number', () => {
    expect(loginSchema.safeParse({ ...valid, password: 'PasswordOnly' }).success).toBe(false)
  })

  test('accepts password with number anywhere', () => {
    expect(loginSchema.safeParse({ ...valid, password: 'password1' }).success).toBe(true)
  })
})
