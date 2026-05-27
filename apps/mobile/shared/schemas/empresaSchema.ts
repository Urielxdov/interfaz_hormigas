import { z } from 'zod'
import { passwordStrong } from './usuarioSchema'

export const empresaSchema = z.object({
  empresa: z.object({
    nombre: z.string()
      .min(1, 'El nombre es obligatorio')
      .min(3, 'Mínimo 3 caracteres')
      .max(120, 'Máximo 120 caracteres')
      .transform(v => v.trim()),
    rfc: z.string()
      .min(1, 'El RFC es obligatorio')
      .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i, 'RFC inválido — ej. ABC010101XYZ')
      .transform(v => v.toUpperCase().trim()),
    direccion: z.string()
      .min(1, 'La dirección es obligatoria')
      .max(250, 'Máximo 250 caracteres')
      .transform(v => v.trim()),
    telefono: z.string()
      .regex(/^[0-9]{10}$/, 'Debe ser exactamente 10 dígitos'),
  }),
  admin: z.object({
    nombre: z.string()
      .min(1, 'El nombre es obligatorio')
      .min(3, 'Mínimo 3 caracteres')
      .max(80, 'Máximo 80 caracteres')
      .transform(v => v.trim()),
    correo: z.string()
      .min(1, 'El correo es obligatorio')
      .max(120, 'Máximo 120 caracteres')
      .email('Formato de correo inválido')
      .transform(v => v.toLowerCase().trim()),
    password: passwordStrong,
  }),
})

export type EmpresaInput = z.input<typeof empresaSchema>
export type EmpresaOutput = z.output<typeof empresaSchema>
