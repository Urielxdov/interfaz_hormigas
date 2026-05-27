import { z } from 'zod'

export const posQuerySchema = z.object({
  query: z.string()
    .max(100, 'Máximo 100 caracteres')
    .refine(v => !/<[^>]*>/.test(v), 'No se permiten etiquetas HTML')
    .transform(v => v.trim()),
})

export const posCantidadSchema = z.object({
  cantidad: z.string()
    .refine(v => /^\d+$/.test(v.trim()), 'Debe ser un número entero')
    .refine(v => parseInt(v, 10) > 0, 'Debe ser mayor a 0'),
})

export const posMontoSchema = z.object({
  montoRecibido: z.string()
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Debe ser mayor a 0')
    .refine(v => /^\d+(\.\d{1,2})?$/.test(v.trim()), 'Máximo 2 decimales'),
})

export type PosQueryInput = z.input<typeof posQuerySchema>
export type PosCantidadInput = z.input<typeof posCantidadSchema>
export type PosMontoInput = z.input<typeof posMontoSchema>
