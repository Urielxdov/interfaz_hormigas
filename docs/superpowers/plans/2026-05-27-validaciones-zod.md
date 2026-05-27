# Validaciones con Zod — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all form validation to Zod schemas shared between hormigas_mobile and hormigas_POS, replacing the existing `validation.ts` dual-layer system.

**Architecture:** Zod schemas live in `@hormigas/mobile-shared/schemas/`, grouped by feature. `hormigas_mobile` uses `zodResolver` + react-hook-form via a `schema` prop on `GenericForm`. Manual-state screens (EmpresasScreen, CategoriasScreen, MovimientosScreen, POSScreen, etc.) call `schema.safeParse()` directly. The `rules` prop is removed from `FormFieldConfig`. `hormigas_POS` adds `@hormigas/mobile-shared` as a dependency.

**Tech Stack:** `zod` (new), `@hookform/resolvers/zod` (new), `react-hook-form` (existing), `@hormigas/mobile-shared` (existing workspace package), `jest` + `ts-jest` (new, shared package only for schema testing)

---

## File Map

**Create:**
- `apps/mobile/shared/schemas/loginSchema.ts`
- `apps/mobile/shared/schemas/usuarioSchema.ts`
- `apps/mobile/shared/schemas/sucursalSchema.ts`
- `apps/mobile/shared/schemas/productoSchema.ts`
- `apps/mobile/shared/schemas/categoriaSchema.ts`
- `apps/mobile/shared/schemas/inventarioSchema.ts`
- `apps/mobile/shared/schemas/movimientoSchema.ts`
- `apps/mobile/shared/schemas/empresaSchema.ts`
- `apps/mobile/shared/schemas/posSchema.ts`
- `apps/mobile/shared/schemas/index.ts`
- `apps/mobile/shared/schemas/__tests__/loginSchema.test.ts`
- `apps/mobile/shared/schemas/__tests__/usuarioSchema.test.ts`
- `apps/mobile/shared/schemas/__tests__/sucursalSchema.test.ts`
- `apps/mobile/shared/schemas/__tests__/productoSchema.test.ts`
- `apps/mobile/shared/schemas/__tests__/categoriaSchema.test.ts`
- `apps/mobile/shared/schemas/__tests__/inventarioSchema.test.ts`
- `apps/mobile/shared/schemas/__tests__/movimientoSchema.test.ts`
- `apps/mobile/shared/schemas/__tests__/empresaSchema.test.ts`
- `apps/mobile/shared/schemas/__tests__/posSchema.test.ts`
- `apps/mobile/shared/tsconfig.jest.json`
- `apps/mobile/shared/jest.config.ts`

**Modify:**
- `apps/mobile/shared/package.json` — add `zod`, `jest`, `ts-jest`, `@types/jest`; add `@hormigas/mobile-shared` test script
- `apps/mobile/shared/index.ts` — export schemas
- `apps/mobile/hormigas_mobile/package.json` — add `@hookform/resolvers`
- `apps/mobile/hormigas_mobile/src/utils/components/Form.tsx` — remove `rules` from `FormFieldConfig`
- `apps/mobile/hormigas_mobile/src/utils/components/Form/Form.tsx` — remove `rules` from `FormFieldConfig`
- `apps/mobile/hormigas_mobile/src/utils/components/Form/GenericForm.tsx` — add `schema` prop
- `apps/mobile/hormigas_mobile/src/login/screens/LoginScreen.tsx` — zodResolver
- `apps/mobile/hormigas_mobile/src/users/screens/CreateUser.tsx` — schema prop
- `apps/mobile/hormigas_mobile/src/branches/screens/CreateBranch.tsx` — schema prop
- `apps/mobile/hormigas_mobile/src/product/screens/CreateProduct.tsx` — schema prop
- `apps/mobile/hormigas_mobile/src/inventario/screens/CreateInventarioScreen.tsx` — safeParse
- `apps/mobile/hormigas_mobile/src/inventario/screens/MovimientoScreen.tsx` — safeParse
- `apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx` — safeParse
- `apps/mobile/hormigas_mobile/src/categorias/screens/CategoriasScreen.tsx` — safeParse
- `apps/mobile/hormigas_mobile/src/superadmin/screens/EmpresasScreen.tsx` — safeParse
- `apps/mobile/hormigas_POS/package.json` — add `@hormigas/mobile-shared`
- `apps/mobile/hormigas_POS/tsconfig.json` — add `@hormigas/mobile-shared` path
- `apps/mobile/hormigas_POS/src/auth/screens/LoginScreen.tsx` — safeParse
- `apps/mobile/hormigas_POS/src/pos/screens/POSScreen.tsx` — safeParse

**Delete:**
- `apps/mobile/hormigas_mobile/src/utils/validation.ts`

---

### Task 1: Install dependencies and setup Jest in shared

**Files:**
- Modify: `apps/mobile/shared/package.json`
- Create: `apps/mobile/shared/tsconfig.jest.json`
- Create: `apps/mobile/shared/jest.config.ts`

- [ ] **Step 1: Add zod to shared, @hookform/resolvers to hormigas_mobile, @hormigas/mobile-shared to hormigas_POS**

```bash
cd apps/mobile/shared && pnpm add zod
cd ../hormigas_mobile && pnpm add @hookform/resolvers
cd ../hormigas_POS && pnpm add @hormigas/mobile-shared@workspace:*
```

- [ ] **Step 2: Add Jest devDependencies to shared**

```bash
cd apps/mobile/shared && pnpm add -D jest ts-jest @types/jest
```

- [ ] **Step 3: Add test script to `apps/mobile/shared/package.json`**

Final `package.json`:
```json
{
  "name": "@hormigas/mobile-shared",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "test": "jest"
  },
  "dependencies": {
    "@hormigas/application": "workspace:*",
    "@hormigas/domain": "workspace:*",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "jest": "^29.7.0",
    "ts-jest": "^29.4.0"
  },
  "peerDependencies": {
    "react": "*",
    "react-native": "*",
    "@react-native-community/netinfo": "*"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": ""
}
```

- [ ] **Step 4: Create `apps/mobile/shared/tsconfig.jest.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 5: Create `apps/mobile/shared/jest.config.ts`**

```ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/schemas/__tests__/**/*.test.ts'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.jest.json',
    },
  },
}

export default config
```

- [ ] **Step 6: Add `@hormigas/mobile-shared` path to `apps/mobile/hormigas_POS/tsconfig.json`**

In `"paths"`, add:
```json
"@hormigas/mobile-shared": ["../shared/index.ts"]
```

- [ ] **Step 7: Verify Jest runs (no tests yet)**

```bash
cd apps/mobile/shared && pnpm test
```
Expected: `No tests found, exiting with code 0` or similar success with 0 tests.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/shared/package.json apps/mobile/shared/tsconfig.jest.json apps/mobile/shared/jest.config.ts apps/mobile/hormigas_mobile/package.json apps/mobile/hormigas_POS/package.json apps/mobile/hormigas_POS/tsconfig.json pnpm-lock.yaml
git commit -m "chore: add zod, @hookform/resolvers, jest to shared/mobile/POS"
```

---

### Task 2: Create loginSchema

**Files:**
- Create: `apps/mobile/shared/schemas/loginSchema.ts`
- Create: `apps/mobile/shared/schemas/__tests__/loginSchema.test.ts`

- [ ] **Step 1: Write the failing test — `apps/mobile/shared/schemas/__tests__/loginSchema.test.ts`**

```ts
import { loginSchema } from '../loginSchema'

describe('loginSchema', () => {
  const valid = { email: 'test@example.com', password: 'Password1' }

  test('accepts valid data', () => {
    expect(loginSchema.safeParse(valid).success).toBe(true)
  })

  test('lowercases and trims email', () => {
    const result = loginSchema.safeParse({ ...valid, email: '  TEST@EXAMPLE.COM  ' })
    expect(result.success && result.data.email).toBe('test@example.com')
  })

  test('rejects missing email', () => {
    expect(loginSchema.safeParse({ ...valid, email: '' }).success).toBe(false)
  })

  test('rejects invalid email format', () => {
    expect(loginSchema.safeParse({ ...valid, email: 'notanemail' }).success).toBe(false)
  })

  test('rejects email over 120 chars', () => {
    const longEmail = 'a'.repeat(115) + '@b.com'
    expect(loginSchema.safeParse({ ...valid, email: longEmail }).success).toBe(false)
  })

  test('rejects password under 8 chars', () => {
    expect(loginSchema.safeParse({ ...valid, password: 'Pass1' }).success).toBe(false)
  })

  test('rejects password over 64 chars', () => {
    expect(loginSchema.safeParse({ ...valid, password: 'Passw0rd' + 'a'.repeat(60) }).success).toBe(false)
  })

  test('rejects password without number', () => {
    expect(loginSchema.safeParse({ ...valid, password: 'PasswordOnly' }).success).toBe(false)
  })

  test('accepts password with number anywhere', () => {
    expect(loginSchema.safeParse({ ...valid, password: 'password1' }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/mobile/shared && pnpm test -- loginSchema
```
Expected: FAIL — `Cannot find module '../loginSchema'`

- [ ] **Step 3: Create `apps/mobile/shared/schemas/loginSchema.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/mobile/shared && pnpm test -- loginSchema
```
Expected: PASS — 9 tests passed

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/shared/schemas/loginSchema.ts apps/mobile/shared/schemas/__tests__/loginSchema.test.ts
git commit -m "feat(schemas): add loginSchema with zod"
```

---

### Task 3: Create usuarioSchema

**Files:**
- Create: `apps/mobile/shared/schemas/usuarioSchema.ts`
- Create: `apps/mobile/shared/schemas/__tests__/usuarioSchema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { usuarioSchema } from '../usuarioSchema'

describe('usuarioSchema', () => {
  const valid = {
    nombre: 'Juan García',
    correo: 'juan@empresa.com',
    password: 'Passw0rd',
    sucursalId: null,
  }

  test('accepts valid data', () => {
    expect(usuarioSchema.safeParse(valid).success).toBe(true)
  })

  test('lowercases correo', () => {
    const result = usuarioSchema.safeParse({ ...valid, correo: 'JUAN@EMPRESA.COM' })
    expect(result.success && result.data.correo).toBe('juan@empresa.com')
  })

  test('rejects nombre under 3 chars', () => {
    expect(usuarioSchema.safeParse({ ...valid, nombre: 'ab' }).success).toBe(false)
  })

  test('rejects nombre over 80 chars', () => {
    expect(usuarioSchema.safeParse({ ...valid, nombre: 'a'.repeat(81) }).success).toBe(false)
  })

  test('accepts nombre with accents', () => {
    expect(usuarioSchema.safeParse({ ...valid, nombre: 'José Ángel Núñez' }).success).toBe(true)
  })

  test('rejects correo over 120 chars', () => {
    const longEmail = 'a'.repeat(115) + '@b.com'
    expect(usuarioSchema.safeParse({ ...valid, correo: longEmail }).success).toBe(false)
  })

  test('rejects password without uppercase', () => {
    expect(usuarioSchema.safeParse({ ...valid, password: 'passw0rd' }).success).toBe(false)
  })

  test('rejects password without lowercase', () => {
    expect(usuarioSchema.safeParse({ ...valid, password: 'PASSW0RD' }).success).toBe(false)
  })

  test('rejects password without number', () => {
    expect(usuarioSchema.safeParse({ ...valid, password: 'Password' }).success).toBe(false)
  })

  test('accepts null sucursalId', () => {
    expect(usuarioSchema.safeParse({ ...valid, sucursalId: null }).success).toBe(true)
  })

  test('accepts positive integer sucursalId', () => {
    expect(usuarioSchema.safeParse({ ...valid, sucursalId: 3 }).success).toBe(true)
  })

  test('rejects negative sucursalId', () => {
    expect(usuarioSchema.safeParse({ ...valid, sucursalId: -1 }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/mobile/shared && pnpm test -- usuarioSchema
```
Expected: FAIL — `Cannot find module '../usuarioSchema'`

- [ ] **Step 3: Create `apps/mobile/shared/schemas/usuarioSchema.ts`**

```ts
import { z } from 'zod'

const passwordStrong = z.string()
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

export { passwordStrong }
export type UsuarioInput = z.input<typeof usuarioSchema>
export type UsuarioOutput = z.output<typeof usuarioSchema>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/mobile/shared && pnpm test -- usuarioSchema
```
Expected: PASS — 12 tests passed

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/shared/schemas/usuarioSchema.ts apps/mobile/shared/schemas/__tests__/usuarioSchema.test.ts
git commit -m "feat(schemas): add usuarioSchema with zod"
```

---

### Task 4: Create sucursalSchema

**Files:**
- Create: `apps/mobile/shared/schemas/sucursalSchema.ts`
- Create: `apps/mobile/shared/schemas/__tests__/sucursalSchema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { sucursalSchema } from '../sucursalSchema'

describe('sucursalSchema', () => {
  const valid = {
    nombre: 'Sucursal Centro',
    direccion: 'Av. Principal 123, Col. Centro',
    codigo: 'CENTRO-01',
    telefono: '5551234567',
    ciudad: 'Monterrey',
    encargadoId: null,
  }

  test('accepts valid data', () => {
    expect(sucursalSchema.safeParse(valid).success).toBe(true)
  })

  test('uppercases codigo', () => {
    const result = sucursalSchema.safeParse({ ...valid, codigo: 'centro-01' })
    expect(result.success && result.data.codigo).toBe('CENTRO-01')
  })

  test('rejects nombre under 3 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, nombre: 'ab' }).success).toBe(false)
  })

  test('rejects nombre over 60 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, nombre: 'a'.repeat(61) }).success).toBe(false)
  })

  test('rejects direccion under 10 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, direccion: 'Calle 1' }).success).toBe(false)
  })

  test('rejects direccion over 100 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, direccion: 'a'.repeat(101) }).success).toBe(false)
  })

  test('rejects codigo under 3 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, codigo: 'AB' }).success).toBe(false)
  })

  test('rejects codigo over 20 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, codigo: 'A'.repeat(21) }).success).toBe(false)
  })

  test('rejects codigo with invalid chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, codigo: 'CENTRO@01' }).success).toBe(false)
  })

  test('accepts codigo with _ and -', () => {
    expect(sucursalSchema.safeParse({ ...valid, codigo: 'CTR_01-A' }).success).toBe(true)
  })

  test('rejects telefono with letters', () => {
    expect(sucursalSchema.safeParse({ ...valid, telefono: '555abc4567' }).success).toBe(false)
  })

  test('rejects telefono with less than 10 digits', () => {
    expect(sucursalSchema.safeParse({ ...valid, telefono: '555123456' }).success).toBe(false)
  })

  test('rejects telefono with more than 10 digits', () => {
    expect(sucursalSchema.safeParse({ ...valid, telefono: '55512345678' }).success).toBe(false)
  })

  test('rejects ciudad over 60 chars', () => {
    expect(sucursalSchema.safeParse({ ...valid, ciudad: 'a'.repeat(61) }).success).toBe(false)
  })

  test('rejects ciudad with numbers', () => {
    expect(sucursalSchema.safeParse({ ...valid, ciudad: 'Monterrey123' }).success).toBe(false)
  })

  test('accepts null encargadoId', () => {
    expect(sucursalSchema.safeParse({ ...valid, encargadoId: null }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/mobile/shared && pnpm test -- sucursalSchema
```
Expected: FAIL — `Cannot find module '../sucursalSchema'`

- [ ] **Step 3: Create `apps/mobile/shared/schemas/sucursalSchema.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/mobile/shared && pnpm test -- sucursalSchema
```
Expected: PASS — 16 tests passed

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/shared/schemas/sucursalSchema.ts apps/mobile/shared/schemas/__tests__/sucursalSchema.test.ts
git commit -m "feat(schemas): add sucursalSchema with zod"
```

---

### Task 5: Create productoSchema

**Files:**
- Create: `apps/mobile/shared/schemas/productoSchema.ts`
- Create: `apps/mobile/shared/schemas/__tests__/productoSchema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { productoSchema } from '../productoSchema'

describe('productoSchema', () => {
  const valid = {
    nombre: 'Laptop Dell',
    sku: 'LAPTOP-001',
    precio: '1500.00',
    estado: true,
    control: false,
    categoriaId: 1,
  }

  test('accepts valid product without stock control', () => {
    expect(productoSchema.safeParse(valid).success).toBe(true)
  })

  test('uppercases sku', () => {
    const result = productoSchema.safeParse({ ...valid, sku: 'laptop-001' })
    expect(result.success && result.data.sku).toBe('LAPTOP-001')
  })

  test('rejects nombre under 2 chars', () => {
    expect(productoSchema.safeParse({ ...valid, nombre: 'L' }).success).toBe(false)
  })

  test('rejects nombre over 120 chars', () => {
    expect(productoSchema.safeParse({ ...valid, nombre: 'a'.repeat(121) }).success).toBe(false)
  })

  test('rejects sku under 3 chars', () => {
    expect(productoSchema.safeParse({ ...valid, sku: 'AB' }).success).toBe(false)
  })

  test('rejects sku over 40 chars', () => {
    expect(productoSchema.safeParse({ ...valid, sku: 'A'.repeat(41) }).success).toBe(false)
  })

  test('rejects sku with invalid chars', () => {
    expect(productoSchema.safeParse({ ...valid, sku: 'LAPTOP@001' }).success).toBe(false)
  })

  test('rejects precio 0 or negative', () => {
    expect(productoSchema.safeParse({ ...valid, precio: '0' }).success).toBe(false)
    expect(productoSchema.safeParse({ ...valid, precio: '-5' }).success).toBe(false)
  })

  test('rejects precio over 999999.99', () => {
    expect(productoSchema.safeParse({ ...valid, precio: '1000000' }).success).toBe(false)
  })

  test('rejects precio with more than 2 decimals', () => {
    expect(productoSchema.safeParse({ ...valid, precio: '10.999' }).success).toBe(false)
  })

  test('rejects missing categoriaId', () => {
    const { categoriaId: _, ...noCat } = valid
    expect(productoSchema.safeParse(noCat).success).toBe(false)
  })

  test('accepts valid product with stock control', () => {
    const withStock = { ...valid, control: true, stockMinimo: '5', stockMaximo: '100' }
    expect(productoSchema.safeParse(withStock).success).toBe(true)
  })

  test('rejects stockMaximo <= stockMinimo when control is true', () => {
    const bad = { ...valid, control: true, stockMinimo: '100', stockMaximo: '50' }
    const result = productoSchema.safeParse(bad)
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('stockMaximo')
    }
  })

  test('rejects negative stockMinimo', () => {
    const bad = { ...valid, control: true, stockMinimo: '-1', stockMaximo: '100' }
    expect(productoSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects stockMaximo over 999999', () => {
    const bad = { ...valid, control: true, stockMinimo: '0', stockMaximo: '1000000' }
    expect(productoSchema.safeParse(bad).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/mobile/shared && pnpm test -- productoSchema
```
Expected: FAIL — `Cannot find module '../productoSchema'`

- [ ] **Step 3: Create `apps/mobile/shared/schemas/productoSchema.ts`**

```ts
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
  categoriaId: z.number({
    required_error: 'La categoría es obligatoria',
    invalid_type_error: 'La categoría es obligatoria',
  }).int().positive('La categoría es obligatoria'),
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/mobile/shared && pnpm test -- productoSchema
```
Expected: PASS — 15 tests passed

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/shared/schemas/productoSchema.ts apps/mobile/shared/schemas/__tests__/productoSchema.test.ts
git commit -m "feat(schemas): add productoSchema with cross-field stock validation"
```

---

### Task 6: Create categoriaSchema

**Files:**
- Create: `apps/mobile/shared/schemas/categoriaSchema.ts`
- Create: `apps/mobile/shared/schemas/__tests__/categoriaSchema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { categoriaSchema } from '../categoriaSchema'

describe('categoriaSchema', () => {
  const valid = { nombre: 'Electrónica', descripcion: '' }

  test('accepts valid data', () => {
    expect(categoriaSchema.safeParse(valid).success).toBe(true)
  })

  test('trims nombre', () => {
    const result = categoriaSchema.safeParse({ ...valid, nombre: '  Electrónica  ' })
    expect(result.success && result.data.nombre).toBe('Electrónica')
  })

  test('rejects nombre under 3 chars', () => {
    expect(categoriaSchema.safeParse({ ...valid, nombre: 'AB' }).success).toBe(false)
  })

  test('rejects nombre over 50 chars', () => {
    expect(categoriaSchema.safeParse({ ...valid, nombre: 'a'.repeat(51) }).success).toBe(false)
  })

  test('accepts empty descripcion (optional)', () => {
    expect(categoriaSchema.safeParse({ ...valid, descripcion: '' }).success).toBe(true)
  })

  test('rejects descripcion over 200 chars', () => {
    expect(categoriaSchema.safeParse({ ...valid, descripcion: 'a'.repeat(201) }).success).toBe(false)
  })

  test('rejects descripcion with HTML tags', () => {
    expect(categoriaSchema.safeParse({ ...valid, descripcion: '<script>alert(1)</script>' }).success).toBe(false)
  })

  test('accepts descripcion with special chars but no HTML', () => {
    expect(categoriaSchema.safeParse({ ...valid, descripcion: 'Producto & más...' }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/mobile/shared && pnpm test -- categoriaSchema
```
Expected: FAIL — `Cannot find module '../categoriaSchema'`

- [ ] **Step 3: Create `apps/mobile/shared/schemas/categoriaSchema.ts`**

```ts
import { z } from 'zod'

export const categoriaSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .transform(v => v.trim()),
  descripcion: z.string()
    .max(200, 'Máximo 200 caracteres')
    .refine(v => !/<[^>]*>/.test(v), 'No se permiten etiquetas HTML')
    .transform(v => v.trim())
    .optional()
    .or(z.literal('')),
})

export type CategoriaInput = z.input<typeof categoriaSchema>
export type CategoriaOutput = z.output<typeof categoriaSchema>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/mobile/shared && pnpm test -- categoriaSchema
```
Expected: PASS — 8 tests passed

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/shared/schemas/categoriaSchema.ts apps/mobile/shared/schemas/__tests__/categoriaSchema.test.ts
git commit -m "feat(schemas): add categoriaSchema with HTML sanitization"
```

---

### Task 7: Create inventarioSchema and movimientoSchema

**Files:**
- Create: `apps/mobile/shared/schemas/inventarioSchema.ts`
- Create: `apps/mobile/shared/schemas/movimientoSchema.ts`
- Create: `apps/mobile/shared/schemas/__tests__/inventarioSchema.test.ts`
- Create: `apps/mobile/shared/schemas/__tests__/movimientoSchema.test.ts`

- [ ] **Step 1: Write the failing tests**

`apps/mobile/shared/schemas/__tests__/inventarioSchema.test.ts`:
```ts
import { inventarioSchema } from '../inventarioSchema'

describe('inventarioSchema', () => {
  const valid = { stockActual: '10', stockMinimo: '5', stockMaximo: '100' }

  test('accepts valid data', () => {
    expect(inventarioSchema.safeParse(valid).success).toBe(true)
  })

  test('rejects negative stockActual', () => {
    expect(inventarioSchema.safeParse({ ...valid, stockActual: '-1' }).success).toBe(false)
  })

  test('rejects non-integer stockActual', () => {
    expect(inventarioSchema.safeParse({ ...valid, stockActual: '5.5' }).success).toBe(false)
  })

  test('rejects negative stockMinimo', () => {
    expect(inventarioSchema.safeParse({ ...valid, stockMinimo: '-1' }).success).toBe(false)
  })

  test('rejects stockMaximo <= stockMinimo', () => {
    const result = inventarioSchema.safeParse({ ...valid, stockMinimo: '50', stockMaximo: '30' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('stockMaximo')
    }
  })

  test('accepts stockMinimo equal to 0', () => {
    expect(inventarioSchema.safeParse({ ...valid, stockMinimo: '0' }).success).toBe(true)
  })
})
```

`apps/mobile/shared/schemas/__tests__/movimientoSchema.test.ts`:
```ts
import { movimientoSchema } from '../movimientoSchema'

describe('movimientoSchema', () => {
  const valid = { cantidad: '5', referencia: '' }

  test('accepts valid data', () => {
    expect(movimientoSchema.safeParse(valid).success).toBe(true)
  })

  test('rejects cantidad 0', () => {
    expect(movimientoSchema.safeParse({ ...valid, cantidad: '0' }).success).toBe(false)
  })

  test('rejects negative cantidad', () => {
    expect(movimientoSchema.safeParse({ ...valid, cantidad: '-1' }).success).toBe(false)
  })

  test('rejects decimal cantidad', () => {
    expect(movimientoSchema.safeParse({ ...valid, cantidad: '5.5' }).success).toBe(false)
  })

  test('accepts empty referencia (optional)', () => {
    expect(movimientoSchema.safeParse({ ...valid, referencia: '' }).success).toBe(true)
  })

  test('rejects referencia over 100 chars', () => {
    expect(movimientoSchema.safeParse({ ...valid, referencia: 'a'.repeat(101) }).success).toBe(false)
  })

  test('rejects referencia with invalid chars', () => {
    expect(movimientoSchema.safeParse({ ...valid, referencia: 'ref@inválida!' }).success).toBe(false)
  })

  test('accepts referencia with allowed chars', () => {
    expect(movimientoSchema.safeParse({ ...valid, referencia: 'ticket-001 #abc_xyz.2' }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/mobile/shared && pnpm test -- inventarioSchema movimientoSchema
```
Expected: FAIL — modules not found

- [ ] **Step 3: Create `apps/mobile/shared/schemas/inventarioSchema.ts`**

```ts
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
```

- [ ] **Step 4: Create `apps/mobile/shared/schemas/movimientoSchema.ts`**

```ts
import { z } from 'zod'

export const movimientoSchema = z.object({
  cantidad: z.string()
    .min(1, 'La cantidad es obligatoria')
    .refine(v => /^\d+$/.test(v.trim()), 'Debe ser un número entero')
    .refine(v => parseInt(v, 10) > 0, 'Debe ser mayor a 0'),
  referencia: z.string()
    .max(100, 'Máximo 100 caracteres')
    .refine(
      v => v === '' || /^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s\-_.#]+$/.test(v),
      'Solo letras, números, espacios y los caracteres # . _ -'
    )
    .transform(v => v.trim())
    .optional()
    .or(z.literal('')),
})

export type MovimientoInput = z.input<typeof movimientoSchema>
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/mobile/shared && pnpm test -- inventarioSchema movimientoSchema
```
Expected: PASS — 14 tests passed

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/shared/schemas/inventarioSchema.ts apps/mobile/shared/schemas/movimientoSchema.ts apps/mobile/shared/schemas/__tests__/inventarioSchema.test.ts apps/mobile/shared/schemas/__tests__/movimientoSchema.test.ts
git commit -m "feat(schemas): add inventarioSchema and movimientoSchema"
```

---

### Task 8: Create empresaSchema

**Files:**
- Create: `apps/mobile/shared/schemas/empresaSchema.ts`
- Create: `apps/mobile/shared/schemas/__tests__/empresaSchema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { empresaSchema } from '../empresaSchema'

describe('empresaSchema', () => {
  const valid = {
    empresa: {
      nombre: 'Empresa Demo SA',
      rfc: 'EDM010101ABC',
      direccion: 'Av. Principal 123',
      telefono: '5551234567',
    },
    admin: {
      nombre: 'Admin Ejemplo',
      correo: 'admin@empresa.com',
      password: 'Passw0rd',
    },
  }

  test('accepts valid data', () => {
    expect(empresaSchema.safeParse(valid).success).toBe(true)
  })

  test('uppercases RFC', () => {
    const result = empresaSchema.safeParse({
      ...valid,
      empresa: { ...valid.empresa, rfc: 'edm010101abc' },
    })
    expect(result.success && result.data.empresa.rfc).toBe('EDM010101ABC')
  })

  test('rejects invalid RFC format', () => {
    const bad = { ...valid, empresa: { ...valid.empresa, rfc: 'INVALID' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('accepts 4-letter RFC prefix (persona física)', () => {
    const ok = { ...valid, empresa: { ...valid.empresa, rfc: 'ABCD010101ABC' } }
    expect(empresaSchema.safeParse(ok).success).toBe(true)
  })

  test('rejects empresa.nombre under 3 chars', () => {
    const bad = { ...valid, empresa: { ...valid.empresa, nombre: 'AB' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects empresa.nombre over 120 chars', () => {
    const bad = { ...valid, empresa: { ...valid.empresa, nombre: 'a'.repeat(121) } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects empresa.telefono with less than 10 digits', () => {
    const bad = { ...valid, empresa: { ...valid.empresa, telefono: '555123456' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects empresa.direccion over 250 chars', () => {
    const bad = { ...valid, empresa: { ...valid.empresa, direccion: 'a'.repeat(251) } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects admin.password without uppercase', () => {
    const bad = { ...valid, admin: { ...valid.admin, password: 'passw0rd' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects admin.correo with invalid format', () => {
    const bad = { ...valid, admin: { ...valid.admin, correo: 'notanemail' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })

  test('rejects admin.nombre under 3 chars', () => {
    const bad = { ...valid, admin: { ...valid.admin, nombre: 'AB' } }
    expect(empresaSchema.safeParse(bad).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/mobile/shared && pnpm test -- empresaSchema
```
Expected: FAIL — `Cannot find module '../empresaSchema'`

- [ ] **Step 3: Create `apps/mobile/shared/schemas/empresaSchema.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/mobile/shared && pnpm test -- empresaSchema
```
Expected: PASS — 11 tests passed

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/shared/schemas/empresaSchema.ts apps/mobile/shared/schemas/__tests__/empresaSchema.test.ts
git commit -m "feat(schemas): add empresaSchema with RFC validation"
```

---

### Task 9: Create posSchema and export all schemas

**Files:**
- Create: `apps/mobile/shared/schemas/posSchema.ts`
- Create: `apps/mobile/shared/schemas/__tests__/posSchema.test.ts`
- Create: `apps/mobile/shared/schemas/index.ts`
- Modify: `apps/mobile/shared/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { posQuerySchema, posCantidadSchema, posMontoSchema } from '../posSchema'

describe('posQuerySchema', () => {
  test('accepts empty query', () => {
    expect(posQuerySchema.safeParse({ query: '' }).success).toBe(true)
  })

  test('trims query', () => {
    const result = posQuerySchema.safeParse({ query: '  laptop  ' })
    expect(result.success && result.data.query).toBe('laptop')
  })

  test('rejects query over 100 chars', () => {
    expect(posQuerySchema.safeParse({ query: 'a'.repeat(101) }).success).toBe(false)
  })
})

describe('posCantidadSchema', () => {
  test('accepts positive integer', () => {
    expect(posCantidadSchema.safeParse({ cantidad: '3' }).success).toBe(true)
  })

  test('rejects 0', () => {
    expect(posCantidadSchema.safeParse({ cantidad: '0' }).success).toBe(false)
  })

  test('rejects negative', () => {
    expect(posCantidadSchema.safeParse({ cantidad: '-1' }).success).toBe(false)
  })

  test('rejects decimal', () => {
    expect(posCantidadSchema.safeParse({ cantidad: '1.5' }).success).toBe(false)
  })
})

describe('posMontoSchema', () => {
  test('accepts valid monto', () => {
    expect(posMontoSchema.safeParse({ montoRecibido: '150.00' }).success).toBe(true)
  })

  test('rejects 0', () => {
    expect(posMontoSchema.safeParse({ montoRecibido: '0' }).success).toBe(false)
  })

  test('rejects more than 2 decimals', () => {
    expect(posMontoSchema.safeParse({ montoRecibido: '10.999' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/mobile/shared && pnpm test -- posSchema
```
Expected: FAIL — `Cannot find module '../posSchema'`

- [ ] **Step 3: Create `apps/mobile/shared/schemas/posSchema.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/mobile/shared && pnpm test -- posSchema
```
Expected: PASS — 9 tests passed

- [ ] **Step 5: Run all schema tests**

```bash
cd apps/mobile/shared && pnpm test
```
Expected: PASS — all 9 test files pass

- [ ] **Step 6: Create `apps/mobile/shared/schemas/index.ts`**

```ts
export * from './loginSchema'
export * from './usuarioSchema'
export * from './sucursalSchema'
export * from './productoSchema'
export * from './categoriaSchema'
export * from './inventarioSchema'
export * from './movimientoSchema'
export * from './empresaSchema'
export * from './posSchema'
```

- [ ] **Step 7: Update `apps/mobile/shared/index.ts` to export schemas**

Add at the end of the file:
```ts
export * from './schemas'
```

Final `apps/mobile/shared/index.ts`:
```ts
export * from './hooks/useUserServiceFactory'
export * from './context/NetworkContext'
export * from './schemas'
```

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/shared/schemas/posSchema.ts apps/mobile/shared/schemas/__tests__/posSchema.test.ts apps/mobile/shared/schemas/index.ts apps/mobile/shared/index.ts
git commit -m "feat(schemas): add posSchema and export all schemas from shared"
```

---

### Task 10: Update FormFieldConfig — remove `rules` prop

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/Form.tsx`
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/Form/Form.tsx`

Both files have the same `FormFieldConfig` type with `rules?: RegisterOptions`. Remove it from both.

- [ ] **Step 1: Remove `rules` from `apps/mobile/hormigas_mobile/src/utils/components/Form.tsx`**

Remove `rules?: RegisterOptions<T, Path<T>>` from `FormFieldConfig` and remove `RegisterOptions` from the import. Also remove the `rules={field.rules}` usage in the Controller.

In the `FormFieldConfig` type, remove:
```ts
rules?: RegisterOptions<T, Path<T>>
```

In the `RegisterOptions` import, remove `RegisterOptions` from the react-hook-form import list.

In the Controller in the render method, remove `rules={field.rules}` if present.

Verify the file compiles cleanly by checking no remaining reference to `rules` in the field config usage.

- [ ] **Step 2: Remove `rules` from `apps/mobile/hormigas_mobile/src/utils/components/Form/Form.tsx`**

Same changes as Step 1 — remove `rules` from `FormFieldConfig` and `RegisterOptions` from imports.

- [ ] **Step 3: Verify TypeScript doesn't complain**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | head -30
```
Expected: Errors about `rules` being passed to `FormFieldConfig` in screens (expected — will fix in subsequent tasks). No errors inside Form.tsx or Form/Form.tsx themselves.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/Form.tsx apps/mobile/hormigas_mobile/src/utils/components/Form/Form.tsx
git commit -m "refactor(form): remove rules prop from FormFieldConfig"
```

---

### Task 11: Update GenericForm to accept `schema` prop

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/utils/components/Form/GenericForm.tsx`

- [ ] **Step 1: Update `GenericForm.tsx`**

Replace the full file content with:

```ts
import ButtonCustom from '@/src/utils/components/ButtonCustom'
import { useForm, DefaultValues, FieldValues, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { Text, View } from 'react-native'
import Form, { FormFieldConfig } from './Form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodType } from 'zod'

interface GenericFormProps<T extends FieldValues> {
  title: string
  subtitle?: string
  fields: FormFieldConfig<T>[]
  defaultValues?: DefaultValues<T>
  onSubmit: (data: T) => void
  submitLabel?: string
  schema?: ZodType<T>
  children?: (control: any, errors: any, watch: UseFormWatch<T>, setValue: UseFormSetValue<T>) => React.ReactNode
}

export function GenericForm<T extends FieldValues> ({
  title,
  subtitle,
  fields,
  defaultValues,
  onSubmit,
  submitLabel = 'Guardar',
  schema,
  children
}: GenericFormProps<T>) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<T>({
    defaultValues,
    resolver: schema ? zodResolver(schema) : undefined,
  })

  return (
    <View className='w-full'>
      <View className='gap-1 p-2'>
        <Text className='text-2xl font-bold'>{title}</Text>
        {subtitle && <Text className='text-gray-500'>{subtitle}</Text>}
      </View>
      <Form
        control={control}
        errors={errors}
        fields={fields}
        scrollable={false}
      >
        {children?.(control, errors, watch, setValue)}
        <ButtonCustom title={submitLabel} onPress={handleSubmit(onSubmit)} />
      </Form>
    </View>
  )
}
```

- [ ] **Step 2: Verify import resolves**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | grep -i "GenericForm\|zodResolver\|hookform" | head -10
```
Expected: No errors about GenericForm or zodResolver.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/utils/components/Form/GenericForm.tsx
git commit -m "feat(form): GenericForm accepts optional schema prop with zodResolver"
```

---

### Task 12: Migrate LoginScreen (mobile)

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/login/screens/LoginScreen.tsx`

- [ ] **Step 1: Replace `fieldRules` usage with `zodResolver`**

Remove the import of `fieldRules` from `@/src/utils/validation`.

Add imports:
```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '@hormigas/mobile-shared'
```

Change the form type from `LoginFormValues` to `LoginInput`.

Remove the local `LoginFormValues` type definition.

Update `LOGIN_FIELDS` to remove all `rules:` properties:
```ts
const LOGIN_FIELDS: FormFieldConfig<LoginInput>[] = [
  {
    name: 'email',
    label: 'Email',
    placeholder: 'tu@email.com',
    autoCapitalize: 'none',
  },
  {
    name: 'password',
    label: 'Contraseña',
    placeholder: '********',
    secureTextEntry: true,
  }
]
```

Update `useForm` to use `zodResolver`:
```ts
const {
  control,
  handleSubmit,
  formState: { errors }
} = useForm<LoginInput>({
  defaultValues: { email: '', password: '' },
  resolver: zodResolver(loginSchema),
})
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | grep -i "LoginScreen" | head -10
```
Expected: No errors for LoginScreen.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/login/screens/LoginScreen.tsx
git commit -m "feat(login): migrate mobile LoginScreen to zodResolver"
```

---

### Task 13: Migrate CreateUser

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/users/screens/CreateUser.tsx`

- [ ] **Step 1: Replace `fieldRules` with `usuarioSchema`**

Remove import of `fieldRules` from `@/src/utils/validation`.

Add:
```ts
import { usuarioSchema, UsuarioInput } from '@hormigas/mobile-shared'
```

Remove local `UserFormValues` type. Use `UsuarioInput` instead.

Update `USER_FORM_FIELDS` — remove all `rules:` properties:
```ts
const USER_FORM_FIELDS: FormFieldConfig<UsuarioInput>[] = [
  {
    name: 'nombre',
    label: 'Nombre',
    placeholder: 'Ej. Juan García',
  },
  {
    name: 'correo',
    label: 'Correo electrónico',
    placeholder: 'Ej. juan@empresa.com',
    autoCapitalize: 'none',
    keyboardType: 'email-address',
  },
  {
    name: 'password',
    label: 'Contraseña',
    secureTextEntry: true,
  },
  {
    name: 'sucursalId',
    label: 'ID Sucursal (opcional)',
    placeholder: 'Ej. 1',
    keyboardType: 'numeric',
  }
]
```

Pass `schema={usuarioSchema}` to `GenericForm`:
```ts
<GenericForm<UsuarioInput>
  title='Nuevo Usuario'
  subtitle='Completa los datos del nuevo usuario'
  fields={USER_FORM_FIELDS}
  schema={usuarioSchema}
  defaultValues={{ nombre: '', correo: '', password: '', sucursalId: null }}
  onSubmit={handleSubmit}
  submitLabel='Crear usuario'
/>
```

Update `handleSubmit` to accept `UsuarioInput`:
```ts
const handleSubmit = (values: UsuarioInput) => {
  onSubmit?.({
    nombre: values.nombre,
    correo: values.correo,
    password: values.password,
    sucursalId: values.sucursalId ?? null,
  })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | grep -i "CreateUser" | head -10
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/users/screens/CreateUser.tsx
git commit -m "feat(users): migrate CreateUser to usuarioSchema"
```

---

### Task 14: Migrate CreateBranch

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/branches/screens/CreateBranch.tsx`

- [ ] **Step 1: Replace `fieldRules` with `sucursalSchema`**

Remove import of `fieldRules` from `@/src/utils/validation`.

Add:
```ts
import { sucursalSchema, SucursalInput } from '@hormigas/mobile-shared'
```

Remove local `BranchFormValues` type. Use `SucursalInput` instead.

Update `BRANCH_FORM_FIELDS` — remove all `rules:` properties:
```ts
const BRANCH_FORM_FIELDS: FormFieldConfig<SucursalInput>[] = [
  { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Sucursal Centro' },
  { name: 'direccion', label: 'Dirección', placeholder: 'Ej. Av. Principal 123' },
  { name: 'codigo', label: 'Código', placeholder: 'Ej. CENTRO-01', autoCapitalize: 'characters' },
  { name: 'telefono', label: 'Teléfono', placeholder: 'Ej. 5551234567', keyboardType: 'numeric' },
  { name: 'ciudad', label: 'Ciudad', placeholder: 'Ej. Monterrey' },
]
```

Pass `schema={sucursalSchema}` and use `SucursalInput` in `GenericForm`:
```ts
<GenericForm<SucursalInput>
  title='Nueva Sucursal'
  subtitle='Completa el formulario para crear una nueva sucursal'
  fields={BRANCH_FORM_FIELDS}
  schema={sucursalSchema}
  defaultValues={{ nombre: '', direccion: '', encargadoId: null, codigo: '', telefono: '', ciudad: '' }}
  onSubmit={data => onSubmit?.(data)}
>
  {(control, errors) => (
    <Controller
      control={control}
      name='encargadoId'
      render={({ field: { value, onChange } }) => (
        <SelectField
          label='Responsable'
          placeholder='Seleccionar responsable...'
          options={userOptions}
          value={value ?? undefined}
          onChange={v => onChange(v)}
          error={(errors.encargadoId as { message?: string } | undefined)?.message}
        />
      )}
    />
  )}
</GenericForm>
```

Update `CreateBranchScreenProps` interface:
```ts
interface CreateBranchScreenProps {
  defaultValues?: Partial<SucursalInput>
  onSubmit?: (data: SucursalInput) => void
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | grep -i "CreateBranch" | head -10
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/branches/screens/CreateBranch.tsx
git commit -m "feat(branches): migrate CreateBranch to sucursalSchema"
```

---

### Task 15: Migrate CreateProduct

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/product/screens/CreateProduct.tsx`

- [ ] **Step 1: Replace inline rules with `productoSchema`**

Add:
```ts
import { productoSchema, ProductoInput } from '@hormigas/mobile-shared'
```

Remove the `rules:` prop from all fields in `PRODUCTS_FORM_FIELDS` and `INVENTARIO_FIELDS`.

Updated field arrays (no `rules`):
```ts
const PRODUCTS_FORM_FIELDS: FormFieldConfig<ProductoInput>[] = [
  { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Laptop Dell XPS 15' },
  { name: 'sku', label: 'SKU', placeholder: 'Ej. LAPTOP-DELL-001', autoCapitalize: 'characters' },
  { name: 'precio', label: 'Precio', placeholder: '0.00', keyboardType: 'decimal-pad' },
  { name: 'estado', label: 'Activo' },
  { name: 'control', label: '¿Control de inventario?' },
]

const INVENTARIO_FIELDS: FormFieldConfig<ProductoInput>[] = [
  { name: 'stockMinimo', label: 'Stock Mínimo', placeholder: '0', keyboardType: 'numeric' },
  { name: 'stockMaximo', label: 'Stock Máximo', placeholder: '0', keyboardType: 'numeric' },
]
```

Pass `schema={productoSchema}` to `GenericForm`:
```ts
<GenericForm<ProductoInput>
  title='Crear Producto'
  subtitle='Completa los datos del nuevo producto'
  fields={PRODUCTS_FORM_FIELDS}
  schema={productoSchema}
  defaultValues={{ nombre: '', sku: '', precio: '', estado: true, control: false, categoriaId: undefined }}
  onSubmit={data => onSubmit?.(data as any)}
>
```

Update `CreateProductScreenProps`:
```ts
interface CreateProductScreenProps {
  defaultValues?: Partial<ProductoInput>
  onSubmit?: (data: ProductoInput) => void
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | grep -i "CreateProduct" | head -10
```
Expected: No critical errors blocking compilation.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/product/screens/CreateProduct.tsx
git commit -m "feat(productos): migrate CreateProduct to productoSchema"
```

---

### Task 16: Migrate CreateInventarioScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/inventario/screens/CreateInventarioScreen.tsx`

- [ ] **Step 1: Replace `validateStock` with `inventarioSchema.safeParse`**

Remove:
```ts
import { validateStock } from '@/src/utils/validation'
```

Add:
```ts
import { inventarioSchema } from '@hormigas/mobile-shared'
```

Replace the `handleSubmit` validation block:

```ts
const handleSubmit = async () => {
  const stockResult = inventarioSchema.safeParse({
    stockActual,
    stockMinimo,
    stockMaximo,
  })

  const errs: StockErrors = {
    productoId: !productoId ? 'Selecciona un producto' : undefined,
  }

  if (!stockResult.success) {
    const flat = stockResult.error.flatten().fieldErrors
    errs.stockActual = flat.stockActual?.[0]
    errs.stockMinimo = flat.stockMinimo?.[0]
    errs.stockMaximo = flat.stockMaximo?.[0]
  }

  setErrors(errs)
  if (Object.values(errs).some(Boolean)) return

  setLoading(true)
  try {
    await onSuccess({
      sucursalId,
      productoId: productoId!,
      stockActual: Number(stockActual),
      stockMinimo: Number(stockMinimo),
      stockMaximo: Number(stockMaximo),
    })
  } catch {
    setErrors(prev => ({ ...prev, stockActual: 'Error al crear inventario' }))
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | grep -i "CreateInventario" | head -10
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/inventario/screens/CreateInventarioScreen.tsx
git commit -m "feat(inventario): migrate CreateInventarioScreen to inventarioSchema"
```

---

### Task 17: Migrate MovimientoScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/inventario/screens/MovimientoScreen.tsx`

- [ ] **Step 1: Replace `validateCantidad` / `validateReferencia` with `movimientoSchema.safeParse`**

Remove:
```ts
import { validateCantidad, validateReferencia } from '@/src/utils/validation'
```

Add:
```ts
import { movimientoSchema } from '@hormigas/mobile-shared'
```

Replace the validation in `handleSubmit`:
```ts
const handleSubmit = async () => {
  const result = movimientoSchema.safeParse({ cantidad, referencia })
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors
    setCantidadError(flat.cantidad?.[0] ?? null)
    setReferenciaError(flat.referencia?.[0] ?? null)
    return
  }
  // Stock disponible check for SALIDA (server validates definitively, this is UX feedback)
  if (tipo === 'SALIDA' && stockActual !== undefined && parseInt(cantidad, 10) > stockActual) {
    setCantidadError(`Stock insuficiente (disponible: ${stockActual})`)
    return
  }
  setCantidadError(null)
  setReferenciaError(null)
  try {
    const res = await registrar({
      sucursalId,
      productoId,
      inventarioId,
      tipoMovimiento: tipo,
      cantidad: parseInt(cantidad, 10),
      referencia: referencia.trim() || undefined,
    } satisfies CrearMovimientoDTO)
    onSuccess(res)
  } catch {
    // error state set by hook
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | grep -i "MovimientoScreen" | head -10
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/inventario/screens/MovimientoScreen.tsx
git commit -m "feat(inventario): migrate MovimientoScreen to movimientoSchema"
```

---

### Task 18: Migrate MovimientosScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx`

- [ ] **Step 1: Replace `validateCantidad` / `validateReferencia` with `movimientoSchema.safeParse`**

Remove:
```ts
import { validateCantidad, validateReferencia } from '@/src/utils/validation'
```

Add:
```ts
import { movimientoSchema } from '@hormigas/mobile-shared'
```

Locate the submit handler (around line 205) that calls `validateCantidad` and `validateReferencia`. Replace with:

```ts
const result = movimientoSchema.safeParse({ cantidad: form.cantidad, referencia: form.referencia })
if (!result.success) {
  const flat = result.error.flatten().fieldErrors
  setCantidadError(flat.cantidad?.[0] ?? null)
  setReferenciaError(flat.referencia?.[0] ?? null)
  return
}
setCantidadError(null)
setReferenciaError(null)
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | grep -i "MovimientosScreen" | head -10
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/movimientos/screens/MovimientosScreen.tsx
git commit -m "feat(movimientos): migrate MovimientosScreen to movimientoSchema"
```

---

### Task 19: Migrate CategoriasScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/categorias/screens/CategoriasScreen.tsx`

- [ ] **Step 1: Replace inline validation with `categoriaSchema.safeParse`**

Add at top:
```ts
import { categoriaSchema } from '@hormigas/mobile-shared'
```

Remove the inline validation variables:
```ts
// REMOVE these lines:
const NOMBRE_PATTERN = /^[\p{L}\p{N}\s\-_&/.]+$/u
const nombreTrimmed = nombre.trim()
const nombreError = ...
```

In `handleCrear`, replace the `if (nombreError)` block with:
```ts
const handleCrear = async () => {
  const result = categoriaSchema.safeParse({ nombre, descripcion })
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors
    const err = flat.nombre?.[0] ?? flat.descripcion?.[0]
    if (err) {
      showError(err)
      return
    }
  }
  try {
    await crear({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
    })
    setNombre('')
    setDescripcion('')
    setModal(false)
  } catch (e) {
    showError(e instanceof Error ? e.message : 'No se pudo crear la categoría')
  }
}
```

Update the disabled condition on the button — replace `!!nombreError` with an inline check:
```ts
disabled={saving || !nombre.trim() || nombre.trim().length < 3}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | grep -i "CategoriasScreen" | head -10
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/categorias/screens/CategoriasScreen.tsx
git commit -m "feat(categorias): migrate CategoriasScreen to categoriaSchema"
```

---

### Task 20: Migrate EmpresasScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/superadmin/screens/EmpresasScreen.tsx`

- [ ] **Step 1: Replace validate functions with `empresaSchema.safeParse`**

Remove:
```ts
import { validateNombre, validateNombreLugar, validateEmail, validatePassword, validateRFC, validateTelefono } from '@/src/utils/validation'
```

Add:
```ts
import { empresaSchema } from '@hormigas/mobile-shared'
```

Replace the `handleCrear` validation block:
```ts
const handleCrear = async () => {
  const result = empresaSchema.safeParse({ empresa: empForm, admin: admForm })

  if (!result.success) {
    const flat = result.error.flatten()
    const empFlat = (result.error.flatten().nested as any)
    // Extract field errors per sub-object
    const allIssues = result.error.issues
    const newEmpErrors: EmpresaErrors = {}
    const newAdmErrors: AdminErrors = {}

    for (const issue of allIssues) {
      const [section, field] = issue.path as [string, string]
      if (section === 'empresa' && field in empForm) {
        newEmpErrors[field as keyof EmpresaForm] = issue.message
      } else if (section === 'admin' && field in admForm) {
        newAdmErrors[field as keyof AdminForm] = issue.message
      }
    }

    setEmpErrors(newEmpErrors)
    setAdmErrors(newAdmErrors)
    return
  }

  setEmpErrors({})
  setAdmErrors({})

  try {
    await crear({ empresa: empForm, admin: admForm })
    setEmpForm(EMPTY_EMP)
    setAdmForm(EMPTY_ADM)
    setModal(false)
  } catch (e) {
    showError(e instanceof Error ? e.message : 'No se pudo crear la empresa')
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | grep -i "EmpresasScreen" | head -10
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_mobile/src/superadmin/screens/EmpresasScreen.tsx
git commit -m "feat(superadmin): migrate EmpresasScreen to empresaSchema"
```

---

### Task 21: Migrate POS LoginScreen

**Files:**
- Modify: `apps/mobile/hormigas_POS/src/auth/screens/LoginScreen.tsx`

- [ ] **Step 1: Add validation with `loginSchema`**

Add imports:
```ts
import { loginSchema } from '@hormigas/mobile-shared'
```

Add error state:
```ts
const [emailError, setEmailError] = useState<string | null>(null)
const [passwordError, setPasswordError] = useState<string | null>(null)
```

Replace the `handleLogin` validation:
```ts
const handleLogin = async () => {
  const result = loginSchema.safeParse({ email, password })
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors
    setEmailError(flat.email?.[0] ?? null)
    setPasswordError(flat.password?.[0] ?? null)
    return
  }
  setEmailError(null)
  setPasswordError(null)
  setLoading(true)
  try {
    await login(result.data)
    router.replace('/(tabs)/pos')
  } catch {
    Alert.alert('Error', 'Credenciales incorrectas')
  } finally {
    setLoading(false)
  }
}
```

Add error display below each TextInput:
```tsx
{emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
{passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
```

Add error style:
```ts
errorText: {
  color: '#ef4444',
  fontSize: 12,
  marginTop: -4,
},
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_POS && npx tsc --noEmit 2>&1 | grep -i "LoginScreen" | head -10
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_POS/src/auth/screens/LoginScreen.tsx
git commit -m "feat(pos): add loginSchema validation to POS LoginScreen"
```

---

### Task 22: Migrate POSScreen

**Files:**
- Modify: `apps/mobile/hormigas_POS/src/pos/screens/POSScreen.tsx`

- [ ] **Step 1: Add `posQuerySchema`, `posCantidadSchema`, `posMontoSchema` validation**

Add imports:
```ts
import { posQuerySchema, posCantidadSchema, posMontoSchema } from '@hormigas/mobile-shared'
```

Add error state:
```ts
const [cantidadErrors, setCantidadErrors] = useState<Record<string, string>>({})
const [montoError, setMontoError] = useState<string | null>(null)
```

In `handleAdd`, validate cantidad before adding to cart:
```ts
const handleAdd = (product: ProductWithStock) => {
  const rawQty = quantities[product.productoLocalId] ?? '1'
  const result = posCantidadSchema.safeParse({ cantidad: rawQty })
  if (!result.success) {
    setCantidadErrors(prev => ({
      ...prev,
      [product.productoLocalId]: result.error.flatten().fieldErrors.cantidad?.[0] ?? 'Inválido',
    }))
    return
  }
  setCantidadErrors(prev => { const next = { ...prev }; delete next[product.productoLocalId]; return next })
  addToCart(product, parseInt(rawQty, 10))
  setQuantities(prev => ({ ...prev, [product.productoLocalId]: '1' }))
}
```

Display cantidad error below each product's TextInput:
```tsx
{cantidadErrors[p.productoLocalId] ? (
  <Text style={styles.errorText}>{cantidadErrors[p.productoLocalId]}</Text>
) : null}
```

In `registerSale` handler (or before calling it), validate montoRecibido:
```ts
const handleRegisterSale = () => {
  const result = posMontoSchema.safeParse({ montoRecibido })
  if (!result.success) {
    setMontoError(result.error.flatten().fieldErrors.montoRecibido?.[0] ?? 'Monto inválido')
    return
  }
  if (parseFloat(montoRecibido) < total) {
    setMontoError('El monto es insuficiente para cubrir el total')
    return
  }
  setMontoError(null)
  registerSale()
}
```

Update the `registerSale` button `onPress` to call `handleRegisterSale`.

Display `montoError` below the monto TextInput.

Add error style (if not already present):
```ts
errorText: {
  color: '#ef4444',
  fontSize: 12,
  marginTop: 2,
},
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/mobile/hormigas_POS && npx tsc --noEmit 2>&1 | grep -i "POSScreen" | head -10
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/hormigas_POS/src/pos/screens/POSScreen.tsx
git commit -m "feat(pos): add quantity and monto validation to POSScreen"
```

---

### Task 23: Delete validation.ts and final verification

**Files:**
- Delete: `apps/mobile/hormigas_mobile/src/utils/validation.ts`

- [ ] **Step 1: Verify no remaining imports of validation.ts**

```bash
grep -r "from '@/src/utils/validation'" apps/mobile/hormigas_mobile/src --include="*.ts" --include="*.tsx"
```
Expected: No output. If any files remain, go back and migrate them.

- [ ] **Step 2: Delete the file**

```bash
rm apps/mobile/hormigas_mobile/src/utils/validation.ts
```

- [ ] **Step 3: Run full TypeScript check on hormigas_mobile**

```bash
cd apps/mobile/hormigas_mobile && npx tsc --noEmit 2>&1 | head -30
```
Expected: No errors.

- [ ] **Step 4: Run all schema tests one final time**

```bash
cd apps/mobile/shared && pnpm test
```
Expected: All tests pass.

- [ ] **Step 5: Run full TypeScript check on hormigas_POS**

```bash
cd apps/mobile/hormigas_POS && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "chore: delete validation.ts — fully replaced by zod schemas in shared"
```

---

## Self-Review

**Spec coverage:**
- ✅ Login email/password — Task 2, 12, 21
- ✅ Usuarios nombre/correo/passwordStrong/sucursalId — Task 3, 13
- ✅ Sucursales nombre/dirección/codigo/telefono/ciudad/encargadoId — Task 4, 14
- ✅ Productos nombre/sku/precio/estado/control/stock/categoría — Task 5, 15
- ✅ Cross-field stock validation — Task 5
- ✅ Categorías nombre/descripción + HTML sanitization — Task 6, 19
- ✅ Inventario stockActual/Minimo/Maximo + cross-field — Task 7, 16
- ✅ Movimientos cantidad/referencia — Task 7, 17, 18
- ✅ Empresas (empresa + admin nested) RFC format — Task 8, 20
- ✅ POS query/cantidad/montoRecibido — Task 9, 22
- ✅ Transforms: uppercase (codigo, sku, rfc), lowercase+trim (email), trim (nombre, dirección) — in each schema
- ✅ montoRecibido >= totalVenta — Task 22 (inline check, not in schema)
- ✅ Uniqueness/DB existence — excluded (server responsibility, noted in spec)
- ✅ Shared package setup — Task 1
- ✅ GenericForm schema prop — Task 11
- ✅ FormFieldConfig rules removed — Task 10
- ✅ POS tsconfig/package updated — Task 1
- ✅ validation.ts deleted — Task 23
