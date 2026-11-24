import { z } from 'zod'

/** Reglas compatibles con el backend (NuevaCategoriaDTO): 3-50 caracteres, letras, números, espacios y -_&/. */
export const categoriaSchema = z.object({
  nombre: z.string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[\p{L}\p{N}\s\-_&/.]+$/u, 'Solo letras, números, espacios y los caracteres - _ & / .')
    .transform(v => v.replace(/\s+/g, ' ')),
  descripcion: z.union([
    z.string()
      .trim()
      .max(200, 'Máximo 200 caracteres')
      .refine(v => !/<[^>]*>/.test(v), 'No se permiten etiquetas HTML'),
    z.literal(''),
  ]).optional(),
})

export type CategoriaInput = z.input<typeof categoriaSchema>
export type CategoriaOutput = z.output<typeof categoriaSchema>
