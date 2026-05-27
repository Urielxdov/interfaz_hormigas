# Diseño: Validaciones con Zod — hormigas_mobile + hormigas_POS

**Fecha:** 2026-05-27  
**Estado:** Aprobado

---

## Contexto

El proyecto tiene dos apps React Native en un monorepo pnpm workspace:
- `apps/mobile/hormigas_mobile` — app admin
- `apps/mobile/hormigas_POS` — app punto de venta
- `apps/mobile/shared` — package compartido `@hormigas/mobile-shared`

Actualmente `hormigas_mobile` tiene `src/utils/validation.ts` con dos capas:
- `fieldRules` — objetos `RegisterOptions` para react-hook-form
- `validate*` — funciones para pantallas con estado manual

Las reglas son incompletas vs la spec. `hormigas_POS` no tiene ninguna validación.

---

## Decisión

Migrar a **Zod schemas en `@hormigas/mobile-shared`** con **`zodResolver` de `@hookform/resolvers`** para forms con react-hook-form. Eliminar `validation.ts` al final.

---

## Estructura de archivos

```
apps/mobile/shared/
  schemas/
    loginSchema.ts
    usuarioSchema.ts
    sucursalSchema.ts
    productoSchema.ts
    categoriaSchema.ts
    inventarioSchema.ts
    movimientoSchema.ts
    empresaSchema.ts
    posSchema.ts
  index.ts               ← re-exporta todos los schemas
  package.json           ← agrega zod como dependency

apps/mobile/hormigas_mobile/
  package.json           ← agrega @hookform/resolvers
  src/utils/
    validation.ts        ← BORRAR al completar migración

apps/mobile/hormigas_POS/
  package.json           ← agrega @hookform/resolvers si se añade RHF en el futuro
```

---

## Cambios a componentes existentes

### `FormFieldConfig` — quita `rules`

```ts
export type FormFieldConfig<T extends FieldValues> = {
  name: Path<T>
  label: string
  placeholder?: string
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: TextInputProps['autoCapitalize']
  secureTextEntry?: boolean
  scrollable?: boolean
  // rules: RegisterOptions ← ELIMINADO
}
```

### `GenericForm` — acepta `schema` opcional

```ts
interface GenericFormProps<T extends FieldValues> {
  schema?: ZodSchema<T>
  // ...resto igual
}

const { control, handleSubmit, ... } = useForm<T>({
  defaultValues,
  resolver: schema ? zodResolver(schema) : undefined
})
```

Pantallas que instancian `useForm` directamente (LoginScreen, etc.) pasan `resolver: zodResolver(loginSchema)` ellas mismas.

---

## Contenido de schemas

### Passwords diferenciales

Login — solo 1 número:
```ts
const passwordLogin = z.string().min(8).max(64)
  .regex(/(?=.*[0-9])/, 'Debe contener al menos 1 número')
```

Usuarios / Empresas — uppercase + lowercase + número:
```ts
const passwordStrong = z.string().min(8).max(64)
  .regex(/(?=.*[A-Z])/, 'Debe contener al menos 1 mayúscula')
  .regex(/(?=.*[a-z])/, 'Debe contener al menos 1 minúscula')
  .regex(/(?=.*[0-9])/, 'Debe contener al menos 1 número')
```

### Transformaciones automáticas

```ts
codigo: z.string().transform(v => v.toUpperCase().trim())
sku:    z.string().transform(v => v.toUpperCase().trim())
email:  z.string().transform(v => v.toLowerCase().trim())
rfc:    z.string().transform(v => v.toUpperCase().trim())
nombre: z.string().transform(v => v.trim())
```

### Cross-field validation (stockMinimo ≤ stockMaximo)

```ts
productoSchema.superRefine((data, ctx) => {
  if (data.control && data.stockMinimo >= data.stockMaximo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stockMaximo'],
      message: 'Debe ser mayor al stock mínimo'
    })
  }
})
```

### RFC (Empresas)

```ts
rfc: z.string()
  .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'RFC inválido — ej. ABC010101XYZ')
  .transform(v => v.toUpperCase())
```

### Sanitización HTML

Aplicar a: `categoria.descripcion`, `filtros.titleSku`, `movimiento.referencia`:
```ts
.refine(v => !/<[^>]*>/.test(v), 'No se permiten etiquetas HTML')
```

### Teléfono

Exactamente 10 dígitos numéricos:
```ts
telefono: z.string().regex(/^[0-9]{10}$/, 'Debe ser exactamente 10 dígitos')
```

### montoRecibido (POS)

Requiere contexto de totalVenta — validar en pantalla, no en schema:
```ts
// En POSScreen al submit:
if (parseFloat(montoRecibido) < totalVenta) {
  setError('montoRecibido', 'Monto insuficiente')
}
```

---

## Manejo de errores

### Pantallas con react-hook-form

`zodResolver` mapea errores por campo automáticamente. `Form.tsx` muestra `error.message` sin cambios.

### Pantallas con estado manual (EmpresasScreen, CategoriasScreen, etc.)

```ts
const [errors, setErrors] = useState<Record<string, string>>({})

const validate = (): boolean => {
  const result = schema.safeParse(form)
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors
    setErrors(Object.fromEntries(
      Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])
    ))
    return false
  }
  setErrors({})
  return true
}
```

---

## Validaciones fuera de scope (servidor)

Las siguientes reglas de la spec son responsabilidad del backend — el frontend solo muestra el error que regresa la API:

- `unique` — correo, nombre categoría, SKU, código sucursal
- `validar existencia en DB` — sucursalId, encargadoId, categoríaId
- `validar stock disponible` — salidas de inventario y POS

---

## Reglas por pantalla (resumen)

| Pantalla | Schema | Approach |
|---|---|---|
| LoginScreen (mobile) | `loginSchema` | `zodResolver` en `useForm` |
| CreateUser | `usuarioSchema` | `zodResolver` en `GenericForm` |
| CreateBranch | `sucursalSchema` | `zodResolver` en `GenericForm` |
| CreateProduct | `productoSchema` | `zodResolver` en `GenericForm` |
| CategoriasScreen | `categoriaSchema` | `safeParse` manual |
| CreateInventarioScreen | `inventarioSchema` | `zodResolver` en `GenericForm` |
| MovimientoScreen | `movimientoSchema` | `zodResolver` en `GenericForm` |
| MovimientosScreen | `movimientoSchema` | `safeParse` manual |
| EmpresasScreen | `empresaSchema` | `safeParse` manual |
| LoginScreen (POS) | `loginSchema` (shared) | state manual + `safeParse` |
| POSScreen | `posSchema` | state manual + `safeParse` |

---

## Orden de migración

1. Instalar `zod` en `@hormigas/mobile-shared`, `@hookform/resolvers` en `hormigas_mobile`
2. Crear todos los schemas en `shared/schemas/` — sin tocar pantallas
3. Actualizar `GenericForm` para aceptar `schema` prop
4. Quitar `rules` de `FormFieldConfig`
5. Migrar pantallas con `GenericForm` (CreateUser, CreateBranch, CreateProduct, CreateInventario, MovimientoScreen)
6. Migrar pantallas con `useForm` propio (LoginScreen mobile)
7. Migrar pantallas con estado manual (EmpresasScreen, CategoriasScreen, MovimientosScreen)
8. Migrar POS (LoginScreen POS, POSScreen)
9. Borrar `validation.ts`
