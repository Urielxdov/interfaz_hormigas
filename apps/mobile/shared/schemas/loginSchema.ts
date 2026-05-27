import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'El correo es obligatorio')
    .max(120, 'Máximo 120 caracteres')
    .email('Formato de correo inválido')
    .transform(v => v.toLowerCase().trim()),
  password: z.string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'Mínimo 8 caracteres')
    .max(64, 'Máximo 64 caracteres')
    .regex(/(?=.*[0-9])/, 'Debe contener al menos 1 número'),
})

export type LoginInput = z.input<typeof loginSchema>
export type LoginOutput = z.output<typeof loginSchema>
