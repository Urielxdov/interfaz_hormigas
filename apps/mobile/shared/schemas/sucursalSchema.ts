import { z } from 'zod'

export const sucursalSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(60, 'Máximo 60 caracteres')
    .transform(v => v.trim()),
  direccion: z.string()
    .min(1, 'La dirección es obligatoria')
    .min(10, 'Mínimo 10 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .transform(v => v.trim()),
  codigo: z.string()
    .min(1, 'El código es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Za-z0-9_-]+$/, 'Solo letras, números, _ y -')
    .transform(v => v.toUpperCase().trim()),
  telefono: z.string()
    .regex(/^[0-9]{10}$/, 'Debe ser exactamente 10 dígitos'),
  ciudad: z.string()
    .min(1, 'La ciudad es obligatoria')
    .max(60, 'Máximo 60 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, 'Solo letras y espacios')
    .transform(v => v.trim()),
  encargadoId: z.number().int().positive('Debe ser entero positivo').nullable().optional(),
})

export type SucursalInput = z.input<typeof sucursalSchema>
export type SucursalOutput = z.output<typeof sucursalSchema>
