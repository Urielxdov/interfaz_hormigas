import type { RegisterOptions } from 'react-hook-form'

// ── react-hook-form rules ──────────────────────────────────────────────────

export const fieldRules = {
  nombre: {
    required: 'El nombre es obligatorio',
    minLength: { value: 2, message: 'Mínimo 2 caracteres' },
    maxLength: { value: 60, message: 'Máximo 60 caracteres' },
    pattern: {
      value: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/,
      message: 'Solo letras y espacios',
    },
  } satisfies RegisterOptions,

  nombreLugar: {
    required: 'El nombre es obligatorio',
    minLength: { value: 2, message: 'Mínimo 2 caracteres' },
    maxLength: { value: 80, message: 'Máximo 80 caracteres' },
    pattern: {
      value: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-_.,()]+$/,
      message: 'Caracteres no permitidos',
    },
  } satisfies RegisterOptions,

  email: {
    required: 'El correo es obligatorio',
    maxLength: { value: 100, message: 'Máximo 100 caracteres' },
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
      message: 'Formato de correo inválido',
    },
  } satisfies RegisterOptions,

  password: {
    required: 'La contraseña es obligatoria',
    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
    maxLength: { value: 100, message: 'Máximo 100 caracteres' },
    pattern: {
      value: /^(?=.*[a-zA-Z])(?=.*[0-9]).+$/,
      message: 'Debe contener al menos una letra y un número',
    },
  } satisfies RegisterOptions,

  direccion: {
    required: 'La dirección es obligatoria',
    minLength: { value: 5, message: 'Mínimo 5 caracteres' },
    maxLength: { value: 150, message: 'Máximo 150 caracteres' },
  } satisfies RegisterOptions,

  telefono: {
    pattern: {
      value: /^[0-9\s\-()+]{7,15}$/,
      message: 'Teléfono inválido (7-15 dígitos)',
    },
  } satisfies RegisterOptions,

  codigo: {
    maxLength: { value: 20, message: 'Máximo 20 caracteres' },
    pattern: {
      value: /^[A-Z0-9\-_]+$/i,
      message: 'Solo letras, números, guiones y guiones bajos',
    },
  } satisfies RegisterOptions,

  ciudad: {
    maxLength: { value: 50, message: 'Máximo 50 caracteres' },
    pattern: {
      value: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/,
      message: 'Solo letras y espacios',
    },
  } satisfies RegisterOptions,
}

// ── validadores para pantallas con estado manual ──────────────────────────

export function validateNombre(v: string): string | null {
  if (!v.trim()) return 'El nombre es obligatorio'
  if (v.length < 2) return 'Mínimo 2 caracteres'
  if (v.length > 60) return 'Máximo 60 caracteres'
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(v)) return 'Solo letras y espacios'
  return null
}

export function validateNombreLugar(v: string): string | null {
  if (!v.trim()) return 'El nombre es obligatorio'
  if (v.length < 2) return 'Mínimo 2 caracteres'
  if (v.length > 80) return 'Máximo 80 caracteres'
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-_.,()]+$/.test(v)) return 'Caracteres no permitidos'
  return null
}

export function validateEmail(v: string): string | null {
  if (!v.trim()) return 'El correo es obligatorio'
  if (v.length > 100) return 'Máximo 100 caracteres'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Formato de correo inválido'
  return null
}

export function validatePassword(v: string): string | null {
  if (!v) return 'La contraseña es obligatoria'
  if (v.length < 8) return 'Mínimo 8 caracteres'
  if (v.length > 100) return 'Máximo 100 caracteres'
  if (!/^(?=.*[a-zA-Z])(?=.*[0-9]).+$/.test(v)) return 'Debe contener al menos una letra y un número'
  return null
}

export function validateRFC(v: string): string | null {
  if (!v.trim()) return 'El RFC es obligatorio'
  if (!/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(v.toUpperCase()))
    return 'RFC inválido — ej. ABC010101XYZ'
  return null
}

export function validateTelefono(v: string): string | null {
  if (!v) return null
  if (!/^[0-9\s\-()+]{7,15}$/.test(v)) return 'Teléfono inválido (7-15 dígitos)'
  return null
}

export function validateStock(v: string, label = 'Este campo'): string | null {
  if (!v.trim()) return `${label} es obligatorio`
  const n = Number(v)
  if (!Number.isInteger(n) || isNaN(n) || v.includes('.')) return 'Debe ser un número entero'
  if (n < 0) return 'No puede ser negativo'
  if (n > 999_999) return 'Máximo 999,999'
  return null
}

export function validateCantidad(v: string): string | null {
  if (!v.trim()) return 'La cantidad es obligatoria'
  const n = parseInt(v, 10)
  if (isNaN(n) || v.includes('.')) return 'Debe ser un número entero'
  if (n <= 0) return 'Debe ser mayor a 0'
  if (n > 99_999) return 'Máximo 99,999'
  return null
}

export function validateReferencia(v: string): string | null {
  if (!v) return null
  if (v.length > 100) return 'Máximo 100 caracteres'
  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s\-_.#/]+$/.test(v)) return 'Caracteres no permitidos'
  return null
}
