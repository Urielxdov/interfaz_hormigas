import { z } from 'zod'

export const passwordStrong = z.string()
  .min(1, 'La contraseña es obligatoria')
  .min(8, 'Mínimo 8 caracteres')
  .max(64, 'Máximo 64 caracteres')
  .regex(/(?=.*[A-Z])/, 'Debe contener al menos 1 mayúscula')
  .regex(/(?=.*[a-z])/, 'Debe contener al menos 1 minúscula')
  .regex(/(?=.*[0-9])/, 'Debe contener al menos 1 número')

export const usuarioSchema = z.object({
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
  sucursalId: z.number().int().positive('Debe ser entero positivo').nullable().optional(),
})

export type UsuarioInput = z.input<typeof usuarioSchema>
export type UsuarioOutput = z.output<typeof usuarioSchema>
