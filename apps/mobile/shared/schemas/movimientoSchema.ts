import { z } from 'zod'

export const movimientoSchema = z.object({
  cantidad: z.string()
    .min(1, 'La cantidad es obligatoria')
    .refine(v => /^\d+$/.test(v.trim()), 'Debe ser un número entero')
    .refine(v => parseInt(v, 10) > 0, 'Debe ser mayor a 0'),
  referencia: z.union([
    z.string()
      .max(100, 'Máximo 100 caracteres')
      .refine(
        v => /^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s\-_.#]+$/.test(v),
        'Solo letras, números, espacios y los caracteres # . _ -'
      )
      .transform(v => v.trim()),
    z.literal(''),
  ]).optional(),
})

export type MovimientoInput = z.input<typeof movimientoSchema>
