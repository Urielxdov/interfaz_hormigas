# Inventario Ciclo A — Design Spec

**Date:** 2026-05-18  
**Scope:** Quitar mocks, scaffolding inventario/movimientos, fix motivos en backend  
**Out of scope (Ciclo B):** Traslados, Reportes completos, CRUD Motivos

---

## 1. Contexto

App offline-first React Native (Expo 54) + Spring Boot backend. Arquitectura limpia: domain ← application ← infrastructure ← mobile app.

Mocks a eliminar:
- `BranchSummaryScreen` — array `sucursales` hardcodeado
- `LowStockSection` — array `lowStockProducts` hardcodeado
- `BranchesScreen` — modal crear/editar comentado

---

## 2. Estrategia de datos: Opción C

- **Lectura:** SQLite local (cache) → si hay red, sync desde API → actualiza cache
- **Escritura (movimientos, crear inventario):** requiere red → llama API → invalida cache (re-fetch)
- Justificación: operaciones de stock son críticas en tiempo real; inventario difiere del catálogo de productos que sí es offline-first completo.

---

## 3. Arquitectura de capas

### Domain (`packages/domain`)

Nuevas entidades:
```ts
// entities/inventario/InventarioItem.ts
interface InventarioItem {
  id: number
  productoId: number
  productoNombre: string
  precio?: number
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

// entities/movimiento/Movimiento.ts
interface Movimiento {
  id: number
  productoId: number; productoNombre: string
  sucursalId: number; sucursalNombre: string
  tipoMovimiento: TipoMovimiento
  cantidad: number; stockAnterior: number; stockNuevo: number
  usuarioNombre: string
  referencia?: string
  fecha: string
  alerta: AlertaStock | null
}

// entities/movimiento/AlertaStock.ts
interface AlertaStock {
  tipo: 'STOCK_CRITICO' | 'STOCK_BAJO' | 'STOCK_EXCEDIDO'
  mensaje: string
}

// entities/movimiento/TipoMovimiento.ts
type TipoMovimiento =
  | 'COMPRA' | 'VENTA' | 'AJUSTE' | 'MERMA'
  | 'DEVOLUCION_CLIENTE' | 'DEVOLUCION_PROVEEDOR'

// entities/motivo/Motivo.ts
interface Motivo {
  id: number; nombre: string
  descripcion?: string; tipoMovimiento: TipoMovimiento
}
```

### Application (`packages/application`)

Nuevos ports:
```ts
// port/inventario-api.port.ts
interface IApiInventarioRepository {
  listarPorSucursal(sucursalId: number): Promise<InventarioItemDTO[]>
  crear(dto: CreateInventarioDTO): Promise<InventarioItemDTO>
}

// port/movimiento-api.port.ts
interface IApiMovimientoRepository {
  crear(dto: CreateMovimientoDTO): Promise<MovimientoResponseDTO>
  buscar(filtros: MovimientoFiltroDTO): Promise<MovimientoResponseDTO[]>
}

// port/motivo-api.port.ts
interface IApiMotivoRepository {
  listar(): Promise<MotivoDTO[]>
}

// port/inventario-sqlite.port.ts
interface ISqliteInventarioRepository {
  findBySucursal(sucursalId: number): Promise<InventarioItemDTO[]>
  upsertMany(items: InventarioItemDTO[]): Promise<void>
  findLowStock(): Promise<InventarioItemDTO[]>  // stockActual < stockMinimo, todas sucursales
}
```

Nuevos DTOs en `use-cases/inventario/`:
```ts
interface InventarioItemDTO { /* igual a InventarioItem */ }
interface CreateInventarioDTO {
  sucursalId: number; productoId: number
  stockActual: number; stockMinimo: number; stockMaximo: number
}
interface CreateMovimientoDTO {
  sucursalId: number; productoId: number
  tipoMovimiento: TipoMovimiento; cantidad: number
  referencia?: string; motivoId?: number
}
interface MovimientoFiltroDTO {
  sucursalId?: number; productoId?: number; inventarioId?: number
  tipo?: TipoMovimiento; fechaInicio?: string; fechaFin?: string
}
interface MovimientoResponseDTO { /* campos + alerta */ }
interface MotivoDTO { id: number; nombre: string; descripcion?: string; tipoMovimiento: TipoMovimiento }
```

### Infrastructure (`packages/infrastructure`)

Nuevas implementaciones:
- `src/inventario/ApiInventarioRepositoryImpl.ts` — llama `/api/inventario/crear` y `/api/inventario/porSucursal`
- `src/inventario/SqliteInventarioRepositoryImpl.ts` — cache en tabla `inventario_cache`
- `src/movimiento/ApiMovimientoRepositoryImpl.ts` — llama `/api/movimiento/crear` y `/api/movimiento/buscar`
- `src/motivo/ApiMotivoRepositoryImpl.ts` — llama `/api/motivos-movimiento` (GET sin params, empresa del JWT)

Nueva migration:
```ts
// db/sqlite/migrations/006_create_inventario_cache.ts
CREATE TABLE IF NOT EXISTS inventario_cache (
  id INTEGER PRIMARY KEY,
  producto_id INTEGER NOT NULL,
  producto_nombre TEXT NOT NULL,
  precio REAL,
  sucursal_id INTEGER NOT NULL,
  sucursal_nombre TEXT NOT NULL,
  stock_actual INTEGER NOT NULL,
  stock_minimo INTEGER NOT NULL,
  stock_maximo INTEGER NOT NULL,
  synced_at INTEGER NOT NULL
)
```

Exportar nuevas clases en `packages/infrastructure/index.ts`.

### Mobile adapters (`apps/mobile/hormigas_mobile/src/adapters/`)

- `inventarioServiceInstance.ts` — lazy singleton que construye `ApiInventarioRepositoryImpl` + `SqliteInventarioRepositoryImpl`
- `movimientoServiceInstance.ts` — lazy singleton para `ApiMovimientoRepositoryImpl`
- `motivoServiceInstance.ts` — lazy singleton para `ApiMotivoRepositoryImpl`

---

## 4. Navegación (Expo Router)

```
app/
├── (tabs)/branche.tsx          ← ya existe
├── (branche)/
│   ├── newBranch.tsx            ← ya existe
│   └── [sucursalId]/
│       ├── inventario.tsx       ← NUEVO
│       └── movimiento.tsx       ← NUEVO
```

Flujo:
```
BranchesScreen
  → tap fila → router.push('/(branche)/[sucursalId]/inventario')
    → InventarioScreen
      → botón "+" → modal CreateInventarioScreen
      → tap item / botón VENTA|COMPRA → router.push('/(branche)/[sucursalId]/movimiento?inventarioId=...')
        → MovimientoScreen
          → guardar → invalida cache → router.back()
```

---

## 5. Pantallas nuevas

### InventarioScreen
- Header: nombre de sucursal + botón "+"
- Lista: `InventarioItemDTO[]` de cache (sync on mount si online)
- Cada item muestra: nombre, SKU, stock actual, badge de alerta si `stockActual < stockMinimo`
- Acciones por item: botón VENTA (rojo), COMPRA (verde) → navega a MovimientoScreen con tipo pre-seleccionado

### CreateInventarioScreen (modal)
- Selector de producto (lista de `GET /api/producto/buscar`)
- Campos: stockActual, stockMinimo, stockMaximo
- Submit: POST `/api/inventario/crear` → invalida cache → cierra modal

### MovimientoScreen
- Tipo de movimiento:
  - Botones fijos: VENTA (rojo), COMPRA (verde) — si vino con tipo pre-seleccionado, el botón ya activo
  - Combo (Picker) para: AJUSTE, MERMA, DEVOLUCION_CLIENTE, DEVOLUCION_PROVEEDOR
- Campo cantidad (numérico)
- Selector motivo (opcional) — cargado de `GET /api/motivos-movimiento`
- Campo referencia (opcional)
- Al guardar exitoso: si `alerta !== null` mostrar `AlertCard` según tipo antes de regresar

---

## 6. Eliminación de mocks

### `BranchSummaryScreen`
- Consume `useBranches()` (ya existente) para lista de sucursales
- Por cada sucursal: llama `GET /api/reportes/valor-inventario?sucursalId={id}`
- Muestra: `valorTotal`, count de productos con/sin precio
- Estado: si hay items en esa sucursal con `stockActual < stockMinimo` → "Atencion", sino → "Optimo"
- Loading state mientras carga

### `LowStockSection`
- Llama `ISqliteInventarioRepository.findLowStock()` (lee cache)
- Si online: sincroniza primero desde todas las sucursales
- Filtra `stockActual < stockMinimo` — mapea a `ProductCardProps`

### `BranchesScreen` — fix modal comentado
- Descomenta el `<Modal>`
- Corrige handler `updateBranch`: el bug era pasar `data.direccion` incompleto en el spread — se pasa el objeto completo correctamente
- Conecta `createBranch` y `updateBranch` del hook existente

---

## 7. Fix backend Spring Boot

**Archivo:** `MotivoMovimientoController.java`

Cambios:
- `GET /{empresaId}` → `GET /` — extraer empresaId del JWT (igual que otros controllers usan `@AuthenticationPrincipal`)
- `POST /` — quitar campo `empresaId` de `CrearMotivoDTO`, tomar empresa del usuario autenticado en el service

**Archivo:** `MotivoMovimientoService.java` (y `CrearMotivoDTO.java`)
- Modificar `crear(dto, usuario)` para recibir el usuario autenticado y obtener empresa de ahí
- Modificar `listar(usuario)` para filtrar por empresa del usuario

---

## 8. Orden de implementación

1. Fix backend: motivos sin empresaId
2. Domain: nuevas entidades y tipos
3. Application: ports + DTOs
4. Infrastructure: impls API + SQLite + migration
5. Exportar en index.ts de infrastructure
6. Mobile adapters (instancias)
7. Hooks: `useInventario`, `useMovimiento`, `useMotivo`
8. Pantallas: InventarioScreen, MovimientoScreen, CreateInventarioScreen
9. Conectar BranchSummaryScreen y LowStockSection
10. Fix modal BranchesScreen
