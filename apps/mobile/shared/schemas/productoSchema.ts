import { z } from 'zod'

export const productoSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es obligatorio')
    .min(2, 'Mínimo 2 caracteres')
    .max(120, 'Máximo 120 caracteres')
    .transform(v => v.trim()),
  sku: z.string()
    .min(1, 'El SKU es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(/^[A-Za-z0-9_-]+$/, 'Solo letras, números, _ y -')
    .transform(v => v.toUpperCase().trim()),
  precio: z.string()
    .min(1, 'El precio es obligatorio')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Debe ser mayor a 0')
    .refine(v => parseFloat(v) <= 999999.99, 'Máximo $999,999.99')
    .refine(v => /^\d+(\.\d{1,2})?$/.test(v.trim()), 'Máximo 2 decimales'),
  estado: z.boolean().default(true),
  control: z.boolean().default(false),
  stockMinimo: z.string().optional(),
  stockMaximo: z.string().optional(),
  categoriaId: z.number({ error: 'La categoría es obligatoria' }).int().positive('La categoría es obligatoria'),
}).superRefine((data, ctx) => {
  if (!data.control) return

  const min = data.stockMinimo !== undefined ? parseInt(data.stockMinimo, 10) : NaN
  const max = data.stockMaximo !== undefined ? parseInt(data.stockMaximo, 10) : NaN

  if (isNaN(min) || min < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stockMinimo'],
      message: 'Stock mínimo debe ser >= 0',
    })
    return
  }
  if (isNaN(max) || max > 999999) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stockMaximo'],
      message: 'Stock máximo debe ser <= 999,999',
    })
    return
  }
  if (min >= max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stockMaximo'],
      message: 'Debe ser mayor al stock mínimo',
    })
  }
})

export type ProductoInput = z.input<typeof productoSchema>
export type ProductoOutput = z.output<typeof productoSchema>
