import { z } from 'zod'

const stockField = (label: string) =>
  z.string()
    .min(1, `${label} es obligatorio`)
    .refine(v => /^\d+$/.test(v.trim()), `${label} debe ser entero`)
    .refine(v => parseInt(v, 10) >= 0, `${label} debe ser >= 0`)

export const inventarioSchema = z.object({
  stockActual: stockField('Stock inicial'),
  stockMinimo: stockField('Stock mínimo'),
  stockMaximo: stockField('Stock máximo'),
}).superRefine((data, ctx) => {
  const min = parseInt(data.stockMinimo, 10)
  const max = parseInt(data.stockMaximo, 10)
  if (!isNaN(min) && !isNaN(max) && min >= max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stockMaximo'],
      message: 'Debe ser mayor al stock mínimo',
    })
  }
})

export type InventarioInput = z.input<typeof inventarioSchema>
