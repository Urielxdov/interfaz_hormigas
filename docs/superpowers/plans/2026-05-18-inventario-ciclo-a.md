# Inventario Ciclo A — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quitar mocks de home/branches, implementar inventario + movimientos con cache offline-first (Opción C: lectura SQLite, escritura online), y fijar JWT scoping en backend motivos.

**Architecture:** Clean architecture domain←application←infrastructure←mobile. Lecturas usan cache SQLite sincronizado al conectar; escrituras de movimientos/inventario requieren red y re-fetchean cache tras éxito. Backend Spring Boot fix: motivos toman empresa del JWT en lugar de path param.

**Tech Stack:** React Native (Expo 54), Expo Router, expo-sqlite, NativeWind, Spring Boot (Java), JWT Bearer

---

## File Map

**Backend (modificar):**
- `hormigas/src/main/java/com/example/hormigas/motivo/dto/CrearMotivoDTO.java`
- `hormigas/src/main/java/com/example/hormigas/motivo/service/MotivoMovimientoService.java`
- `hormigas/src/main/java/com/example/hormigas/motivo/controller/MotivoMovimientoController.java`

**Domain (modificar):**
- `packages/domain/database/Schema.ts` — agregar columnas cache a tabla inventario

**Application (crear):**
- `packages/application/port/inventario-api.port.ts`
- `packages/application/port/movimiento-api.port.ts`
- `packages/application/port/motivo-api.port.ts`
- `packages/application/port/reporte-api.port.ts`
- `packages/application/use-cases/inventario/inventario.dto.ts`
- `packages/application/use-cases/movimiento/movimiento.dto.ts`
- `packages/application/use-cases/motivo/motivo.dto.ts`
- `packages/application/use-cases/reporte/reporte.dto.ts`

**Application (modificar):**
- `packages/application/index.ts` — re-exportar nuevos ports y DTOs

**Infrastructure (crear):**
- `packages/infrastructure/src/inventario/SqliteInventarioRepositoryImpl.ts`
- `packages/infrastructure/src/inventario/ApiInventarioRepositoryImpl.ts`
- `packages/infrastructure/src/movimiento/ApiMovimientoRepositoryImpl.ts`
- `packages/infrastructure/src/motivo/ApiMotivoRepositoryImpl.ts`
- `packages/infrastructure/src/reporte/ApiReporteRepositoryImpl.ts`

**Infrastructure (modificar):**
- `packages/infrastructure/index.ts` — exportar nuevas implementaciones

**Mobile (modificar):**
- `apps/mobile/hormigas_mobile/db/DataBase.ts` — agregar ALTER TABLE migration para nuevas columnas

**Mobile (crear):**
- `apps/mobile/hormigas_mobile/src/adapters/inventarioServiceInstance.ts`
- `apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts`
- `apps/mobile/hormigas_mobile/src/adapters/motivoServiceInstance.ts`
- `apps/mobile/hormigas_mobile/src/adapters/reporteServiceInstance.ts`
- `apps/mobile/hormigas_mobile/src/utils/hooks/useInventario.ts`
- `apps/mobile/hormigas_mobile/src/utils/hooks/useMovimiento.ts`
- `apps/mobile/hormigas_mobile/src/utils/hooks/useMotivo.ts`
- `apps/mobile/hormigas_mobile/src/inventario/screens/InventarioScreen.tsx`
- `apps/mobile/hormigas_mobile/src/inventario/screens/CreateInventarioScreen.tsx`
- `apps/mobile/hormigas_mobile/src/inventario/screens/MovimientoScreen.tsx`
- `apps/mobile/hormigas_mobile/app/(branche)/[sucursalId]/inventario.tsx`
- `apps/mobile/hormigas_mobile/app/(branche)/[sucursalId]/movimiento.tsx`

**Mobile (modificar):**
- `apps/mobile/hormigas_mobile/src/home/components/BranchSummaryScreen.tsx`
- `apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx`
- `apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx`

---

## Task 1: Fix backend — motivos JWT scoping

**Files:**
- Modify: `hormigas/src/main/java/com/example/hormigas/motivo/dto/CrearMotivoDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/motivo/service/MotivoMovimientoService.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/motivo/controller/MotivoMovimientoController.java`

- [ ] **Step 1: Update CrearMotivoDTO — quitar empresaId**

```java
// hormigas/src/main/java/com/example/hormigas/motivo/dto/CrearMotivoDTO.java
package com.example.hormigas.motivo.dto;

import com.example.hormigas.movimiento.entity.TipoMovimiento;

public record CrearMotivoDTO(
        String nombre,
        String descripcion,
        TipoMovimiento tipoMovimiento
) {}
```

- [ ] **Step 2: Update MotivoMovimientoService — recibir empresa del usuario**

```java
// hormigas/src/main/java/com/example/hormigas/motivo/service/MotivoMovimientoService.java
package com.example.hormigas.motivo.service;

import com.example.hormigas.empresa.entity.Empresa;
import com.example.hormigas.motivo.dto.ActualizarMotivoDTO;
import com.example.hormigas.motivo.dto.CrearMotivoDTO;
import com.example.hormigas.motivo.dto.MotivoMovimientoResponse;
import com.example.hormigas.motivo.entity.MotivoMovimiento;
import com.example.hormigas.motivo.mapper.MotivoMovimientoMapper;
import com.example.hormigas.motivo.repository.MotivoMovimientoRepository;
import com.example.hormigas.security.domain.Usuario;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MotivoMovimientoService {

    private final MotivoMovimientoRepository motivoMovimientoRepository;

    public MotivoMovimientoService(MotivoMovimientoRepository motivoMovimientoRepository) {
        this.motivoMovimientoRepository = motivoMovimientoRepository;
    }

    public MotivoMovimientoResponse crear(CrearMotivoDTO dto, Usuario usuario) {
        MotivoMovimiento motivo = new MotivoMovimiento();
        motivo.setNombre(dto.nombre());
        motivo.setDescripcion(dto.descripcion());
        motivo.setTipoMovimiento(dto.tipoMovimiento());
        motivo.setEmpresa(usuario.getEmpresa());
        motivoMovimientoRepository.save(motivo);
        return MotivoMovimientoMapper.toResponse(motivo);
    }

    public List<MotivoMovimientoResponse> listar(Usuario usuario) {
        Empresa empresa = usuario.getEmpresa();
        return motivoMovimientoRepository.findByEmpresaAndActivoTrue(empresa)
                .stream()
                .map(MotivoMovimientoMapper::toResponse)
                .toList();
    }

    public void desactivar(Long id) {
        MotivoMovimiento motivo = motivoMovimientoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No existe el motivo solicitado"));
        motivo.setActivo(false);
        motivoMovimientoRepository.save(motivo);
    }

    public MotivoMovimientoResponse actualizar(Long id, ActualizarMotivoDTO dto) {
        MotivoMovimiento motivo = motivoMovimientoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No existe el movimiento a actualizar"));
        motivo.setNombre(dto.nombre());
        motivo.setDescripcion(dto.descripcion());
        motivo.setTipoMovimiento(dto.tipoMovimiento());
        return MotivoMovimientoMapper.toResponse(motivoMovimientoRepository.save(motivo));
    }
}
```

- [ ] **Step 3: Update MotivoMovimientoRepository — agregar findByEmpresaAndActivoTrue**

```java
// hormigas/src/main/java/com/example/hormigas/motivo/repository/MotivoMovimientoRepository.java
package com.example.hormigas.motivo.repository;

import com.example.hormigas.empresa.entity.Empresa;
import com.example.hormigas.motivo.entity.MotivoMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MotivoMovimientoRepository extends JpaRepository<MotivoMovimiento, Long> {
    List<MotivoMovimiento> findByEmpresa(Empresa empresa);
    List<MotivoMovimiento> findByEmpresaAndActivoTrue(Empresa empresa);
}
```

- [ ] **Step 4: Update MotivoMovimientoController — usar @AuthenticationPrincipal**

```java
// hormigas/src/main/java/com/example/hormigas/motivo/controller/MotivoMovimientoController.java
package com.example.hormigas.motivo.controller;

import com.example.hormigas.motivo.dto.ActualizarMotivoDTO;
import com.example.hormigas.motivo.dto.CrearMotivoDTO;
import com.example.hormigas.motivo.dto.MotivoMovimientoResponse;
import com.example.hormigas.motivo.service.MotivoMovimientoService;
import com.example.hormigas.security.domain.Usuario;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/motivos-movimiento")
public class MotivoMovimientoController {

    private final MotivoMovimientoService motivoMovimientoService;

    public MotivoMovimientoController(MotivoMovimientoService motivoMovimientoService) {
        this.motivoMovimientoService = motivoMovimientoService;
    }

    @PostMapping
    public MotivoMovimientoResponse crear(
            @RequestBody CrearMotivoDTO dto,
            @AuthenticationPrincipal Usuario usuario) {
        return motivoMovimientoService.crear(dto, usuario);
    }

    @GetMapping
    public List<MotivoMovimientoResponse> listar(@AuthenticationPrincipal Usuario usuario) {
        return motivoMovimientoService.listar(usuario);
    }

    @PutMapping("/{id}")
    public MotivoMovimientoResponse actualizar(
            @PathVariable Long id,
            @RequestBody ActualizarMotivoDTO dto) {
        return motivoMovimientoService.actualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public void desactivar(@PathVariable Long id) {
        motivoMovimientoService.desactivar(id);
    }
}
```

- [ ] **Step 5: Compilar backend para verificar**

```bash
cd /home/uhernand/hormigas
./mvnw compile -q
```
Expected: BUILD SUCCESS sin errores de compilación.

- [ ] **Step 6: Commit**

```bash
cd /home/uhernand/hormigas
git add src/main/java/com/example/hormigas/motivo/
git commit -m "fix(motivos): JWT scoping — empresa del token, quitar path param empresaId"
```

---

## Task 2: Application — DTOs y ports de inventario/movimiento/motivo/reporte

**Files:**
- Create: `packages/application/use-cases/inventario/inventario.dto.ts`
- Create: `packages/application/use-cases/movimiento/movimiento.dto.ts`
- Create: `packages/application/use-cases/motivo/motivo.dto.ts`
- Create: `packages/application/use-cases/reporte/reporte.dto.ts`
- Create: `packages/application/port/inventario-api.port.ts`
- Create: `packages/application/port/movimiento-api.port.ts`
- Create: `packages/application/port/motivo-api.port.ts`
- Create: `packages/application/port/reporte-api.port.ts`
- Modify: `packages/application/index.ts`

- [ ] **Step 1: Crear inventario.dto.ts**

```ts
// packages/application/use-cases/inventario/inventario.dto.ts
export interface InventarioItemDTO {
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

export interface CreateInventarioDTO {
  sucursalId: number
  productoId: number
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}
```

- [ ] **Step 2: Crear movimiento.dto.ts**

```ts
// packages/application/use-cases/movimiento/movimiento.dto.ts
export type TipoMovimiento =
  | 'COMPRA'
  | 'VENTA'
  | 'AJUSTE'
  | 'MERMA'
  | 'DEVOLUCION_CLIENTE'
  | 'DEVOLUCION_PROVEEDOR'

export interface AlertaStockDTO {
  tipo: 'STOCK_CRITICO' | 'STOCK_BAJO' | 'STOCK_EXCEDIDO'
  mensaje: string
}

export interface MovimientoResponseDTO {
  id: number
  productoId: number
  productoNombre: string
  sucursalId: number
  sucursalNombre: string
  tipoMovimiento: TipoMovimiento
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  usuarioNombre: string
  referencia?: string
  fecha: string
  alerta: AlertaStockDTO | null
}

export interface CreateMovimientoDTO {
  sucursalId: number
  productoId: number
  tipoMovimiento: TipoMovimiento
  cantidad: number
  referencia?: string
  motivoId?: number
}

export interface MovimientoFiltroDTO {
  sucursalId?: number
  productoId?: number
  inventarioId?: number
  tipo?: TipoMovimiento
  fechaInicio?: string
  fechaFin?: string
}
```

- [ ] **Step 3: Crear motivo.dto.ts**

```ts
// packages/application/use-cases/motivo/motivo.dto.ts
import { TipoMovimiento } from '../movimiento/movimiento.dto'

export interface MotivoDTO {
  id: number
  nombre: string
  descripcion?: string
  tipoMovimiento: TipoMovimiento
}
```

- [ ] **Step 4: Crear reporte.dto.ts**

```ts
// packages/application/use-cases/reporte/reporte.dto.ts
export interface ValorInventarioDetalleDTO {
  productoId: number
  nombre: string
  sku: string
  stockActual: number
  precio: number | null
  valorLinea: number
  sinPrecio: boolean
}

export interface ValorInventarioDTO {
  sucursalId: number
  nombreSucursal: string
  valorTotal: number
  productosConPrecio: number
  productosSinPrecio: number
  detalle: ValorInventarioDetalleDTO[]
}
```

- [ ] **Step 5: Crear inventario-api.port.ts**

```ts
// packages/application/port/inventario-api.port.ts
import { InventarioItemDTO, CreateInventarioDTO } from '../use-cases/inventario/inventario.dto'

export interface IApiInventarioRepository {
  listarPorSucursal(sucursalId: number): Promise<InventarioItemDTO[]>
  crear(dto: CreateInventarioDTO): Promise<InventarioItemDTO>
}

export interface ISqliteInventarioRepository {
  findBySucursal(sucursalId: number): Promise<InventarioItemDTO[]>
  findLowStock(): Promise<InventarioItemDTO[]>
  upsertMany(items: InventarioItemDTO[]): Promise<void>
}
```

- [ ] **Step 6: Crear movimiento-api.port.ts**

```ts
// packages/application/port/movimiento-api.port.ts
import {
  CreateMovimientoDTO,
  MovimientoFiltroDTO,
  MovimientoResponseDTO,
} from '../use-cases/movimiento/movimiento.dto'

export interface IApiMovimientoRepository {
  crear(dto: CreateMovimientoDTO): Promise<MovimientoResponseDTO>
  buscar(filtros: MovimientoFiltroDTO): Promise<MovimientoResponseDTO[]>
}
```

- [ ] **Step 7: Crear motivo-api.port.ts**

```ts
// packages/application/port/motivo-api.port.ts
import { MotivoDTO } from '../use-cases/motivo/motivo.dto'

export interface IApiMotivoRepository {
  listar(): Promise<MotivoDTO[]>
}
```

- [ ] **Step 8: Crear reporte-api.port.ts**

```ts
// packages/application/port/reporte-api.port.ts
import { ValorInventarioDTO } from '../use-cases/reporte/reporte.dto'

export interface IApiReporteRepository {
  valorInventario(sucursalId: number): Promise<ValorInventarioDTO>
}
```

- [ ] **Step 9: Actualizar packages/application/index.ts**

Agregar al final del archivo:

```ts
// Inventario
export * from './port/inventario-api.port'
export * from './port/movimiento-api.port'
export * from './port/motivo-api.port'
export * from './port/reporte-api.port'
export * from './use-cases/inventario/inventario.dto'
export * from './use-cases/movimiento/movimiento.dto'
export * from './use-cases/motivo/motivo.dto'
export * from './use-cases/reporte/reporte.dto'
```

- [ ] **Step 10: Verificar que no hay errores de TypeScript**

```bash
cd /home/uhernand/interfaz_hormigas
pnpm --filter @hormigas/application tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 11: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add packages/application/
git commit -m "feat(application): ports y DTOs para inventario, movimiento, motivo, reporte"
```

---

## Task 3: Domain — Extender tabla inventario en Schema.ts

**Files:**
- Modify: `packages/domain/database/Schema.ts`
- Modify: `apps/mobile/hormigas_mobile/db/DataBase.ts`

- [ ] **Step 1: Agregar columnas cache a tabla inventario en Schema.ts**

Reemplazar la sección `inventario` en `packages/domain/database/Schema.ts`:

```ts
// packages/domain/database/Schema.ts
// (solo la parte de inventario — las demás tablas no cambian)
  CREATE TABLE IF NOT EXISTS inventario (
    id INTEGER PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    producto_nombre TEXT NOT NULL DEFAULT '',
    sucursal_id INTEGER NOT NULL,
    sucursal_nombre TEXT NOT NULL DEFAULT '',
    precio REAL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    stock_maximo INTEGER NOT NULL,
    ultima_actualizacion TEXT,
    synced_at INTEGER NOT NULL DEFAULT 0,
    UNIQUE (sucursal_id, producto_id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id)
  );
```

- [ ] **Step 2: Actualizar DataBase.ts con migración ALTER TABLE para installs existentes**

```ts
// apps/mobile/hormigas_mobile/db/DataBase.ts
import * as SQLite from 'expo-sqlite'
import { CREATE_TABLES_SQL } from '@hormigas/domain'

let db: SQLite.SQLiteDatabase | null = null

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('hormigas.db')
  }
  return db
}

const INVENTARIO_MIGRATIONS = [
  `ALTER TABLE inventario ADD COLUMN producto_nombre TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE inventario ADD COLUMN sucursal_nombre TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE inventario ADD COLUMN precio REAL`,
  `ALTER TABLE inventario ADD COLUMN synced_at INTEGER NOT NULL DEFAULT 0`,
]

export const initDatabase = async () => {
  try {
    const db = await getDB()
    await db.execAsync(CREATE_TABLES_SQL)
    for (const sql of INVENTARIO_MIGRATIONS) {
      try {
        await db.execAsync(sql)
      } catch {
        // columna ya existe — ignorar
      }
    }
    console.log('✅ Base de datos lista')
  } catch (e) {
    console.error('❌ Error en initDatabase:', JSON.stringify(e))
    throw e
  }
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd /home/uhernand/interfaz_hormigas
pnpm --filter @hormigas/domain tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add packages/domain/database/Schema.ts apps/mobile/hormigas_mobile/db/DataBase.ts
git commit -m "feat(domain): extender tabla inventario con columnas de cache"
```

---

## Task 4: Infrastructure — SqliteInventarioRepositoryImpl

**Files:**
- Create: `packages/infrastructure/src/inventario/SqliteInventarioRepositoryImpl.ts`

- [ ] **Step 1: Crear SqliteInventarioRepositoryImpl.ts**

```ts
// packages/infrastructure/src/inventario/SqliteInventarioRepositoryImpl.ts
import { ISqliteInventarioRepository, InventarioItemDTO } from '@hormigas/application'
import { DatabaseClient } from '../../db/contracts/DatabaseClient'

type InventarioRow = {
  id: number
  producto_id: number
  producto_nombre: string
  sucursal_id: number
  sucursal_nombre: string
  precio: number | null
  stock_actual: number
  stock_minimo: number
  stock_maximo: number
  synced_at: number
}

function toDTO(row: InventarioRow): InventarioItemDTO {
  return {
    id: row.id,
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    sucursalId: row.sucursal_id,
    sucursalNombre: row.sucursal_nombre,
    precio: row.precio ?? undefined,
    stockActual: row.stock_actual,
    stockMinimo: row.stock_minimo,
    stockMaximo: row.stock_maximo,
  }
}

export class SqliteInventarioRepositoryImpl implements ISqliteInventarioRepository {
  constructor(private db: DatabaseClient) {}

  async findBySucursal(sucursalId: number): Promise<InventarioItemDTO[]> {
    const rows = await this.db.getMany<InventarioRow>(
      'SELECT * FROM inventario WHERE sucursal_id = ? ORDER BY producto_nombre ASC',
      [sucursalId]
    )
    return rows.map(toDTO)
  }

  async findLowStock(): Promise<InventarioItemDTO[]> {
    const rows = await this.db.getMany<InventarioRow>(
      'SELECT * FROM inventario WHERE stock_actual < stock_minimo ORDER BY stock_actual ASC'
    )
    return rows.map(toDTO)
  }

  async upsertMany(items: InventarioItemDTO[]): Promise<void> {
    const now = Date.now()
    for (const item of items) {
      await this.db.run(
        `INSERT OR REPLACE INTO inventario
         (id, producto_id, producto_nombre, sucursal_id, sucursal_nombre,
          precio, stock_actual, stock_minimo, stock_maximo, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.productoId,
          item.productoNombre,
          item.sucursalId,
          item.sucursalNombre,
          item.precio ?? null,
          item.stockActual,
          item.stockMinimo,
          item.stockMaximo,
          now,
        ]
      )
    }
  }
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /home/uhernand/interfaz_hormigas
pnpm --filter @hormigas/infrastructure tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add packages/infrastructure/src/inventario/SqliteInventarioRepositoryImpl.ts
git commit -m "feat(infra): SqliteInventarioRepositoryImpl — cache read/upsert/lowstock"
```

---

## Task 5: Infrastructure — API implementations

**Files:**
- Create: `packages/infrastructure/src/inventario/ApiInventarioRepositoryImpl.ts`
- Create: `packages/infrastructure/src/movimiento/ApiMovimientoRepositoryImpl.ts`
- Create: `packages/infrastructure/src/motivo/ApiMotivoRepositoryImpl.ts`
- Create: `packages/infrastructure/src/reporte/ApiReporteRepositoryImpl.ts`

- [ ] **Step 1: Crear ApiInventarioRepositoryImpl.ts**

```ts
// packages/infrastructure/src/inventario/ApiInventarioRepositoryImpl.ts
import {
  IApiInventarioRepository,
  InventarioItemDTO,
  CreateInventarioDTO,
} from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

type ServerInventarioDTO = {
  id: number
  productoId: number
  productoNombre: string
  precio: number | null
  sucursalId: number
  sucursalNombre: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
}

function toDTO(s: ServerInventarioDTO): InventarioItemDTO {
  return {
    id: s.id,
    productoId: s.productoId,
    productoNombre: s.productoNombre,
    precio: s.precio ?? undefined,
    sucursalId: s.sucursalId,
    sucursalNombre: s.sucursalNombre,
    stockActual: s.stockActual,
    stockMinimo: s.stockMinimo,
    stockMaximo: s.stockMaximo,
  }
}

export class ApiInventarioRepositoryImpl implements IApiInventarioRepository {
  constructor(private http: ApiHttpClient) {}

  async listarPorSucursal(sucursalId: number): Promise<InventarioItemDTO[]> {
    const rows = await this.http.get<ServerInventarioDTO[]>(
      `/api/inventario/porSucursal?sucursalId=${sucursalId}`
    )
    return rows.map(toDTO)
  }

  async crear(dto: CreateInventarioDTO): Promise<InventarioItemDTO> {
    const row = await this.http.post<ServerInventarioDTO>(
      '/api/inventario/crear',
      dto
    )
    return toDTO(row)
  }
}
```

- [ ] **Step 2: Crear ApiMovimientoRepositoryImpl.ts**

```ts
// packages/infrastructure/src/movimiento/ApiMovimientoRepositoryImpl.ts
import {
  IApiMovimientoRepository,
  CreateMovimientoDTO,
  MovimientoFiltroDTO,
  MovimientoResponseDTO,
} from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiMovimientoRepositoryImpl implements IApiMovimientoRepository {
  constructor(private http: ApiHttpClient) {}

  async crear(dto: CreateMovimientoDTO): Promise<MovimientoResponseDTO> {
    return this.http.post<MovimientoResponseDTO>('/api/movimiento/crear', dto)
  }

  async buscar(filtros: MovimientoFiltroDTO): Promise<MovimientoResponseDTO[]> {
    const params = new URLSearchParams()
    if (filtros.sucursalId != null) params.set('sucursalId', String(filtros.sucursalId))
    if (filtros.productoId != null) params.set('productoId', String(filtros.productoId))
    if (filtros.inventarioId != null) params.set('inventarioId', String(filtros.inventarioId))
    if (filtros.tipo) params.set('tipo', filtros.tipo)
    if (filtros.fechaInicio) params.set('fechaInicio', filtros.fechaInicio)
    if (filtros.fechaFin) params.set('fechaFin', filtros.fechaFin)
    const qs = params.toString()
    return this.http.get<MovimientoResponseDTO[]>(
      `/api/movimiento/buscar${qs ? `?${qs}` : ''}`
    )
  }
}
```

- [ ] **Step 3: Crear ApiMotivoRepositoryImpl.ts**

```ts
// packages/infrastructure/src/motivo/ApiMotivoRepositoryImpl.ts
import { IApiMotivoRepository, MotivoDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiMotivoRepositoryImpl implements IApiMotivoRepository {
  constructor(private http: ApiHttpClient) {}

  async listar(): Promise<MotivoDTO[]> {
    return this.http.get<MotivoDTO[]>('/api/motivos-movimiento')
  }
}
```

- [ ] **Step 4: Crear ApiReporteRepositoryImpl.ts**

```ts
// packages/infrastructure/src/reporte/ApiReporteRepositoryImpl.ts
import { IApiReporteRepository, ValorInventarioDTO } from '@hormigas/application'
import { ApiHttpClient } from '../http/ApiHttpClient'

export class ApiReporteRepositoryImpl implements IApiReporteRepository {
  constructor(private http: ApiHttpClient) {}

  async valorInventario(sucursalId: number): Promise<ValorInventarioDTO> {
    return this.http.get<ValorInventarioDTO>(
      `/api/reportes/valor-inventario?sucursalId=${sucursalId}`
    )
  }
}
```

- [ ] **Step 5: Actualizar packages/infrastructure/index.ts — exportar nuevas implementaciones**

Agregar al final:

```ts
// Inventario repositories
export * from './src/inventario/SqliteInventarioRepositoryImpl'
export * from './src/inventario/ApiInventarioRepositoryImpl'

// Movimiento repositories
export * from './src/movimiento/ApiMovimientoRepositoryImpl'

// Motivo repositories
export * from './src/motivo/ApiMotivoRepositoryImpl'

// Reporte repositories
export * from './src/reporte/ApiReporteRepositoryImpl'
```

- [ ] **Step 6: Verificar TypeScript**

```bash
cd /home/uhernand/interfaz_hormigas
pnpm --filter @hormigas/infrastructure tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add packages/infrastructure/
git commit -m "feat(infra): API/SQLite impls para inventario, movimiento, motivo, reporte"
```

---

## Task 6: Mobile adapters — instancias lazy

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/adapters/inventarioServiceInstance.ts`
- Create: `apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts`
- Create: `apps/mobile/hormigas_mobile/src/adapters/motivoServiceInstance.ts`
- Create: `apps/mobile/hormigas_mobile/src/adapters/reporteServiceInstance.ts`

- [ ] **Step 1: Crear inventarioServiceInstance.ts**

```ts
// apps/mobile/hormigas_mobile/src/adapters/inventarioServiceInstance.ts
import {
  ApiHttpClient,
  ApiInventarioRepositoryImpl,
  SqliteInventarioRepositoryImpl,
  TokenServiceImpl,
} from '@hormigas/infrastructure'
import { getDB } from '@/db/DataBase'
import { ExpoSQLiteClient } from './ExpoSQLiteClient'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

type InventarioRepos = {
  api: ApiInventarioRepositoryImpl
  sqlite: SqliteInventarioRepositoryImpl
}

let _repos: InventarioRepos | null = null
let _initPromise: Promise<InventarioRepos> | null = null

export const getInventarioRepos = (): Promise<InventarioRepos> => {
  if (_repos) return Promise.resolve(_repos)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const db = await getDB()
    const dbClient = new ExpoSQLiteClient(db)
    const tokenService = new TokenServiceImpl(storage)
    const httpClient = new ApiHttpClient(API_URL, tokenService)
    _repos = {
      api: new ApiInventarioRepositoryImpl(httpClient),
      sqlite: new SqliteInventarioRepositoryImpl(dbClient),
    }
    return _repos
  })()

  return _initPromise
}
```

- [ ] **Step 2: Crear movimientoServiceInstance.ts**

```ts
// apps/mobile/hormigas_mobile/src/adapters/movimientoServiceInstance.ts
import {
  ApiHttpClient,
  ApiMovimientoRepositoryImpl,
  TokenServiceImpl,
} from '@hormigas/infrastructure'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _repo: ApiMovimientoRepositoryImpl | null = null
let _initPromise: Promise<ApiMovimientoRepositoryImpl> | null = null

export const getMovimientoRepo = (): Promise<ApiMovimientoRepositoryImpl> => {
  if (_repo) return Promise.resolve(_repo)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const tokenService = new TokenServiceImpl(storage)
    const httpClient = new ApiHttpClient(API_URL, tokenService)
    _repo = new ApiMovimientoRepositoryImpl(httpClient)
    return _repo
  })()

  return _initPromise
}
```

- [ ] **Step 3: Crear motivoServiceInstance.ts**

```ts
// apps/mobile/hormigas_mobile/src/adapters/motivoServiceInstance.ts
import {
  ApiHttpClient,
  ApiMotivoRepositoryImpl,
  TokenServiceImpl,
} from '@hormigas/infrastructure'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _repo: ApiMotivoRepositoryImpl | null = null
let _initPromise: Promise<ApiMotivoRepositoryImpl> | null = null

export const getMotivoRepo = (): Promise<ApiMotivoRepositoryImpl> => {
  if (_repo) return Promise.resolve(_repo)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const tokenService = new TokenServiceImpl(storage)
    const httpClient = new ApiHttpClient(API_URL, tokenService)
    _repo = new ApiMotivoRepositoryImpl(httpClient)
    return _repo
  })()

  return _initPromise
}
```

- [ ] **Step 4: Crear reporteServiceInstance.ts**

```ts
// apps/mobile/hormigas_mobile/src/adapters/reporteServiceInstance.ts
import {
  ApiHttpClient,
  ApiReporteRepositoryImpl,
  TokenServiceImpl,
} from '@hormigas/infrastructure'
import { storage } from './AsyncStorageAdapter'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

let _repo: ApiReporteRepositoryImpl | null = null
let _initPromise: Promise<ApiReporteRepositoryImpl> | null = null

export const getReporteRepo = (): Promise<ApiReporteRepositoryImpl> => {
  if (_repo) return Promise.resolve(_repo)
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    const tokenService = new TokenServiceImpl(storage)
    const httpClient = new ApiHttpClient(API_URL, tokenService)
    _repo = new ApiReporteRepositoryImpl(httpClient)
    return _repo
  })()

  return _initPromise
}
```

- [ ] **Step 5: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/adapters/
git commit -m "feat(adapters): lazy singletons para inventario, movimiento, motivo, reporte"
```

---

## Task 7: Hooks — useInventario, useMovimiento, useMotivo

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/utils/hooks/useInventario.ts`
- Create: `apps/mobile/hormigas_mobile/src/utils/hooks/useMovimiento.ts`
- Create: `apps/mobile/hormigas_mobile/src/utils/hooks/useMotivo.ts`

- [ ] **Step 1: Crear useInventario.ts**

```ts
// apps/mobile/hormigas_mobile/src/utils/hooks/useInventario.ts
import { useCallback, useEffect, useState } from 'react'
import { InventarioItemDTO, CreateInventarioDTO } from '@hormigas/application'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'
import { getInventarioRepos } from '@/src/adapters/inventarioServiceInstance'

export function useInventario(sucursalId: number) {
  const [items, setItems] = useState<InventarioItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isOnline } = useNetwork()

  const loadLocal = useCallback(async () => {
    const { sqlite } = await getInventarioRepos()
    const data = await sqlite.findBySucursal(sucursalId)
    setItems(data)
  }, [sucursalId])

  const syncFromServer = useCallback(async () => {
    try {
      const { api, sqlite } = await getInventarioRepos()
      const data = await api.listarPorSucursal(sucursalId)
      await sqlite.upsertMany(data)
      setItems(data)
    } catch (e) {
      console.warn('[useInventario] syncFromServer:', e)
    }
  }, [sucursalId])

  useEffect(() => {
    setLoading(true)
    loadLocal()
      .then(() => { if (isOnline) return syncFromServer() })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [sucursalId, isOnline, loadLocal, syncFromServer])

  const crearInventario = async (dto: CreateInventarioDTO): Promise<InventarioItemDTO> => {
    const { api, sqlite } = await getInventarioRepos()
    const created = await api.crear(dto)
    await sqlite.upsertMany([created])
    setItems(prev => {
      const exists = prev.some(i => i.id === created.id)
      return exists ? prev.map(i => i.id === created.id ? created : i) : [...prev, created]
    })
    return created
  }

  const refresh = async () => {
    if (!isOnline) return
    await syncFromServer()
  }

  return { items, loading, error, crearInventario, refresh }
}
```

- [ ] **Step 2: Crear useMovimiento.ts**

```ts
// apps/mobile/hormigas_mobile/src/utils/hooks/useMovimiento.ts
import { useState } from 'react'
import { CreateMovimientoDTO, MovimientoResponseDTO } from '@hormigas/application'
import { getMovimientoRepo } from '@/src/adapters/movimientoServiceInstance'

export function useMovimiento() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registrar = async (dto: CreateMovimientoDTO): Promise<MovimientoResponseDTO | null> => {
    setLoading(true)
    setError(null)
    try {
      const repo = await getMovimientoRepo()
      return await repo.crear(dto)
    } catch (e) {
      setError(String(e))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { registrar, loading, error }
}
```

- [ ] **Step 3: Crear useMotivo.ts**

```ts
// apps/mobile/hormigas_mobile/src/utils/hooks/useMotivo.ts
import { useCallback, useEffect, useState } from 'react'
import { MotivoDTO } from '@hormigas/application'
import { getMotivoRepo } from '@/src/adapters/motivoServiceInstance'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

export function useMotivo() {
  const [motivos, setMotivos] = useState<MotivoDTO[]>([])
  const { isOnline } = useNetwork()

  const load = useCallback(async () => {
    if (!isOnline) return
    try {
      const repo = await getMotivoRepo()
      const data = await repo.listar()
      setMotivos(data)
    } catch (e) {
      console.warn('[useMotivo]', e)
    }
  }, [isOnline])

  useEffect(() => { load() }, [load])

  return { motivos }
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd /home/uhernand/interfaz_hormigas
pnpm --filter hormigas_mobile tsc --noEmit 2>&1 | head -40
```
Expected: sin errores relacionados con los nuevos hooks.

- [ ] **Step 5: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/utils/hooks/
git commit -m "feat(hooks): useInventario, useMovimiento, useMotivo"
```

---

## Task 8: InventarioScreen + ruta

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/inventario/screens/InventarioScreen.tsx`
- Create: `apps/mobile/hormigas_mobile/app/(branche)/[sucursalId]/inventario.tsx`
- Modify: `apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx` — tap fila navega a inventario

- [ ] **Step 1: Crear InventarioScreen.tsx**

```tsx
// apps/mobile/hormigas_mobile/src/inventario/screens/InventarioScreen.tsx
import { useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Package, Plus, AlertTriangle } from 'lucide-react-native'
import { InventarioItemDTO } from '@hormigas/application'
import { useInventario } from '@/src/utils/hooks/useInventario'
import Modal from '@/src/utils/components/Modal'
import CreateInventarioScreen from './CreateInventarioScreen'

interface Props {
  sucursalId: number
  sucursalNombre: string
}

function StockBadge({ item }: { item: InventarioItemDTO }) {
  if (item.stockActual === 0) {
    return <Text className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-semibold">Crítico</Text>
  }
  if (item.stockActual < item.stockMinimo) {
    return <Text className="text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-semibold">Bajo</Text>
  }
  return <Text className="text-xs bg-green-100 text-green-600 rounded-full px-2 py-0.5 font-semibold">OK</Text>
}

export default function InventarioScreen({ sucursalId, sucursalNombre }: Props) {
  const { items, loading, crearInventario, refresh } = useInventario(sucursalId)
  const [showCreate, setShowCreate] = useState(false)

  const goToMovimiento = (item: InventarioItemDTO, tipo?: 'VENTA' | 'COMPRA') => {
    const params: Record<string, string> = {
      inventarioId: String(item.id),
      productoId: String(item.productoId),
      productoNombre: item.productoNombre,
    }
    if (tipo) params.tipoPreseleccionado = tipo
    router.push({
      pathname: `/(branche)/[sucursalId]/movimiento`,
      params: { sucursalId: String(sucursalId), ...params },
    })
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 px-5 pt-14 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-gray-900">Inventario</Text>
          <Text className="text-sm text-gray-500">{sucursalNombre}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          className="bg-black rounded-lg p-2 flex-row items-center gap-1"
        >
          <Plus size={18} color="white" />
          <Text className="text-white text-sm font-medium">Agregar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={
          <View className="items-center py-16 gap-2">
            <Package size={48} color="#9ca3af" />
            <Text className="text-gray-400">Sin productos en esta sucursal</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl border border-gray-200 p-4 gap-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{item.productoNombre}</Text>
                {item.precio != null && (
                  <Text className="text-sm text-gray-500">${item.precio.toFixed(2)}</Text>
                )}
              </View>
              <StockBadge item={item} />
            </View>

            <View className="flex-row gap-2 justify-between">
              <View className="items-center">
                <Text className="text-xs text-gray-400">Actual</Text>
                <Text className="font-bold text-lg">{item.stockActual}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-gray-400">Mín</Text>
                <Text className="text-lg">{item.stockMinimo}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-gray-400">Máx</Text>
                <Text className="text-lg">{item.stockMaximo}</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => goToMovimiento(item, 'VENTA')}
                className="flex-1 bg-red-500 rounded-lg py-2 items-center"
              >
                <Text className="text-white font-semibold">Venta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => goToMovimiento(item, 'COMPRA')}
                className="flex-1 bg-green-500 rounded-lg py-2 items-center"
              >
                <Text className="text-white font-semibold">Compra</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => goToMovimiento(item)}
                className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
              >
                <Text className="text-gray-700 font-semibold">Otro</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <CreateInventarioScreen
          sucursalId={sucursalId}
          onSuccess={async (dto) => {
            await crearInventario(dto)
            setShowCreate(false)
          }}
        />
      </Modal>
    </View>
  )
}
```

- [ ] **Step 2: Crear ruta app/(branche)/[sucursalId]/inventario.tsx**

```tsx
// apps/mobile/hormigas_mobile/app/(branche)/[sucursalId]/inventario.tsx
import { useLocalSearchParams } from 'expo-router'
import InventarioScreen from '@/src/inventario/screens/InventarioScreen'

export default function InventarioRoute() {
  const { sucursalId, sucursalNombre } = useLocalSearchParams<{
    sucursalId: string
    sucursalNombre: string
  }>()

  return (
    <InventarioScreen
      sucursalId={Number(sucursalId)}
      sucursalNombre={sucursalNombre ?? ''}
    />
  )
}
```

- [ ] **Step 3: Actualizar BranchesScreen — tap fila navega a inventario**

En `BranchesScreen.tsx`, en la columna `nombre` agregar `onPress` para navegar. Reemplazar la columna `nombre` en el array `columns`:

```tsx
{
  key: 'nombre',
  label: 'Nombre',
  render: (val, row) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/(branche)/[sucursalId]/inventario',
          params: { sucursalId: String(row.id), sucursalNombre: row.nombre },
        })
      }
    >
      <Text className="text-blue-600 underline">{String(val)}</Text>
    </TouchableOpacity>
  )
},
```

Agregar imports al top del archivo:
```tsx
import { router } from 'expo-router'
import { TouchableOpacity } from 'react-native'
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd /home/uhernand/interfaz_hormigas
pnpm --filter hormigas_mobile tsc --noEmit 2>&1 | head -40
```
Expected: sin errores nuevos.

- [ ] **Step 5: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/inventario/ apps/mobile/hormigas_mobile/app/(branche)/
git add apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx
git commit -m "feat(mobile): InventarioScreen + ruta + navegacion desde BranchesScreen"
```

---

## Task 9: CreateInventarioScreen (modal)

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/inventario/screens/CreateInventarioScreen.tsx`

- [ ] **Step 1: Crear CreateInventarioScreen.tsx**

Necesita selector de productos (`GET /api/producto/buscar`). Usa `productServiceInstance` existente para listar productos.

```tsx
// apps/mobile/hormigas_mobile/src/inventario/screens/CreateInventarioScreen.tsx
import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { CreateInventarioDTO } from '@hormigas/application'
import { getProductService } from '@/src/adapters/productServiceInstance'

interface Props {
  sucursalId: number
  onSuccess: (dto: CreateInventarioDTO) => Promise<void>
}

interface ProductoOption {
  id: number
  nombre: string
}

export default function CreateInventarioScreen({ sucursalId, onSuccess }: Props) {
  const [productos, setProductos] = useState<ProductoOption[]>([])
  const [productoId, setProductoId] = useState<number | null>(null)
  const [stockActual, setStockActual] = useState('')
  const [stockMinimo, setStockMinimo] = useState('')
  const [stockMaximo, setStockMaximo] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProductService()
      .then(svc => svc.listAll())
      .then(ps =>
        setProductos(
          ps
            .filter(p => p.serverId != null)
            .map(p => ({ id: p.serverId!, nombre: p.nombre }))
        )
      )
      .catch(() => setError('No se pudieron cargar productos'))
      .finally(() => setLoadingProductos(false))
  }, [])

  const handleSubmit = async () => {
    if (!productoId || !stockActual || !stockMinimo || !stockMaximo) {
      setError('Todos los campos son obligatorios')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSuccess({
        sucursalId,
        productoId,
        stockActual: Number(stockActual),
        stockMinimo: Number(stockMinimo),
        stockMaximo: Number(stockMaximo),
      })
    } catch (e) {
      setError('Error al crear inventario')
    } finally {
      setLoading(false)
    }
  }

  if (loadingProductos) {
    return <ActivityIndicator size="large" style={{ margin: 32 }} />
  }

  return (
    <ScrollView className="p-4" contentContainerStyle={{ gap: 16 }}>
      <Text className="text-xl font-bold">Agregar producto al inventario</Text>

      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">Producto</Text>
        <View className="border border-gray-200 rounded-lg overflow-hidden">
          {productos.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setProductoId(p.id)}
              className={`px-4 py-3 border-b border-gray-100 ${productoId === p.id ? 'bg-blue-50' : ''}`}
            >
              <Text className={productoId === p.id ? 'text-blue-600 font-semibold' : 'text-gray-900'}>
                {p.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {[
        { label: 'Stock inicial', value: stockActual, set: setStockActual },
        { label: 'Stock mínimo', value: stockMinimo, set: setStockMinimo },
        { label: 'Stock máximo', value: stockMaximo, set: setStockMaximo },
      ].map(({ label, value, set }) => (
        <View key={label} className="gap-1">
          <Text className="text-sm font-medium text-gray-700">{label}</Text>
          <TextInput
            value={value}
            onChangeText={set}
            keyboardType="numeric"
            className="border border-gray-200 rounded-lg px-3 py-2 text-base"
            placeholder="0"
          />
        </View>
      ))}

      {error && <Text className="text-red-500 text-sm">{error}</Text>}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className="bg-black rounded-lg py-3 items-center"
      >
        {loading
          ? <ActivityIndicator color="white" />
          : <Text className="text-white font-semibold">Guardar</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}
```

Nota: `productService.listAll()` es el método existente que lista productos desde SQLite local. Verificar el nombre exacto del método en `packages/application/services/product.service.ts` — si es diferente, ajustar el call.

- [ ] **Step 2: Verificar nombre del método en ProductService**

```bash
grep -n "listAll\|getAll\|findAll\|listar" /home/uhernand/interfaz_hormigas/packages/application/services/product.service.ts
```
Ajustar el método en CreateInventarioScreen según el resultado.

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/inventario/screens/CreateInventarioScreen.tsx
git commit -m "feat(mobile): CreateInventarioScreen con selector de productos"
```

---

## Task 10: MovimientoScreen + ruta

**Files:**
- Create: `apps/mobile/hormigas_mobile/src/inventario/screens/MovimientoScreen.tsx`
- Create: `apps/mobile/hormigas_mobile/app/(branche)/[sucursalId]/movimiento.tsx`

- [ ] **Step 1: Crear MovimientoScreen.tsx**

```tsx
// apps/mobile/hormigas_mobile/src/inventario/screens/MovimientoScreen.tsx
import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert
} from 'react-native'
import { router } from 'expo-router'
import { TipoMovimiento, MovimientoResponseDTO } from '@hormigas/application'
import { useMovimiento } from '@/src/utils/hooks/useMovimiento'
import { useMotivo } from '@/src/utils/hooks/useMotivo'
import AlertCard from '@/src/utils/components/AlertCard'

const TIPOS_COMBO: { label: string; value: TipoMovimiento }[] = [
  { label: 'Ajuste de stock', value: 'AJUSTE' },
  { label: 'Merma', value: 'MERMA' },
  { label: 'Devolución cliente', value: 'DEVOLUCION_CLIENTE' },
  { label: 'Devolución proveedor', value: 'DEVOLUCION_PROVEEDOR' },
]

interface Props {
  sucursalId: number
  inventarioId: number
  productoId: number
  productoNombre: string
  tipoPreseleccionado?: TipoMovimiento
  onSuccess: () => void
}

export default function MovimientoScreen({
  sucursalId,
  inventarioId,
  productoId,
  productoNombre,
  tipoPreseleccionado,
  onSuccess,
}: Props) {
  const [tipo, setTipo] = useState<TipoMovimiento>(tipoPreseleccionado ?? 'VENTA')
  const [cantidad, setCantidad] = useState('')
  const [referencia, setReferencia] = useState('')
  const [motivoId, setMotivoId] = useState<number | null>(null)
  const [alerta, setAlerta] = useState<MovimientoResponseDTO['alerta']>(null)

  const { registrar, loading, error } = useMovimiento()
  const { motivos } = useMotivo()

  const handleSubmit = async () => {
    if (!cantidad || Number(cantidad) <= 0) {
      Alert.alert('Error', 'La cantidad debe ser mayor a 0')
      return
    }
    const result = await registrar({
      sucursalId,
      productoId,
      tipoMovimiento: tipo,
      cantidad: Number(cantidad),
      referencia: referencia || undefined,
      motivoId: motivoId ?? undefined,
    })
    if (result) {
      if (result.alerta) {
        setAlerta(result.alerta)
      } else {
        onSuccess()
      }
    }
  }

  if (alerta) {
    return (
      <View className="flex-1 items-center justify-center p-6 gap-4">
        <AlertCard
          type={alerta.tipo === 'STOCK_CRITICO' ? 'error' : 'warning'}
          message={alerta.mensaje}
        />
        <TouchableOpacity
          onPress={onSuccess}
          className="bg-black rounded-lg py-3 px-6"
        >
          <Text className="text-white font-semibold">Continuar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xl font-bold">Registrar movimiento</Text>
        <Text className="text-gray-500">{productoNombre}</Text>
      </View>

      {/* Botones fijos VENTA / COMPRA */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => setTipo('VENTA')}
          className={`flex-1 py-3 rounded-xl items-center border-2 ${tipo === 'VENTA' ? 'bg-red-500 border-red-500' : 'bg-white border-gray-200'}`}
        >
          <Text className={`font-bold ${tipo === 'VENTA' ? 'text-white' : 'text-gray-700'}`}>Venta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTipo('COMPRA')}
          className={`flex-1 py-3 rounded-xl items-center border-2 ${tipo === 'COMPRA' ? 'bg-green-500 border-green-500' : 'bg-white border-gray-200'}`}
        >
          <Text className={`font-bold ${tipo === 'COMPRA' ? 'text-white' : 'text-gray-700'}`}>Compra</Text>
        </TouchableOpacity>
      </View>

      {/* Combo otros tipos */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Otro tipo</Text>
        <View className="flex-row flex-wrap gap-2">
          {TIPOS_COMBO.map(t => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setTipo(t.value)}
              className={`px-3 py-2 rounded-lg border ${tipo === t.value ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-sm ${tipo === t.value ? 'text-white font-semibold' : 'text-gray-700'}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cantidad */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">
          Cantidad {tipo === 'AJUSTE' ? '(nuevo valor absoluto)' : ''}
        </Text>
        <TextInput
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
          className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-base"
          placeholder="0"
        />
      </View>

      {/* Motivo (opcional) */}
      {motivos.length > 0 && (
        <View className="gap-1">
          <Text className="text-sm font-medium text-gray-700">Motivo (opcional)</Text>
          <View className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <TouchableOpacity
              onPress={() => setMotivoId(null)}
              className={`px-4 py-3 border-b border-gray-100 ${motivoId === null ? 'bg-blue-50' : ''}`}
            >
              <Text className={motivoId === null ? 'text-blue-600' : 'text-gray-500'}>Sin motivo</Text>
            </TouchableOpacity>
            {motivos
              .filter(m => m.tipoMovimiento === tipo)
              .map(m => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setMotivoId(m.id)}
                  className={`px-4 py-3 border-b border-gray-100 ${motivoId === m.id ? 'bg-blue-50' : ''}`}
                >
                  <Text className={motivoId === m.id ? 'text-blue-600 font-semibold' : 'text-gray-900'}>
                    {m.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      )}

      {/* Referencia */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Referencia (opcional)</Text>
        <TextInput
          value={referencia}
          onChangeText={setReferencia}
          className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-base"
          placeholder="Ej. ticket-001"
        />
      </View>

      {error && <Text className="text-red-500 text-sm">{error}</Text>}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className="bg-black rounded-lg py-3 items-center"
      >
        {loading
          ? <ActivityIndicator color="white" />
          : <Text className="text-white font-semibold">Registrar movimiento</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}
```

- [ ] **Step 2: Crear ruta app/(branche)/[sucursalId]/movimiento.tsx**

```tsx
// apps/mobile/hormigas_mobile/app/(branche)/[sucursalId]/movimiento.tsx
import { useLocalSearchParams, router } from 'expo-router'
import MovimientoScreen from '@/src/inventario/screens/MovimientoScreen'
import { TipoMovimiento } from '@hormigas/application'

export default function MovimientoRoute() {
  const params = useLocalSearchParams<{
    sucursalId: string
    inventarioId: string
    productoId: string
    productoNombre: string
    tipoPreseleccionado?: string
  }>()

  return (
    <MovimientoScreen
      sucursalId={Number(params.sucursalId)}
      inventarioId={Number(params.inventarioId)}
      productoId={Number(params.productoId)}
      productoNombre={params.productoNombre ?? ''}
      tipoPreseleccionado={params.tipoPreseleccionado as TipoMovimiento | undefined}
      onSuccess={() => router.back()}
    />
  )
}
```

- [ ] **Step 3: Verificar que AlertCard acepta los props necesarios**

```bash
grep -n "type\|message\|props\|interface\|Props" /home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/utils/components/AlertCard.tsx | head -20
```
Ajustar props de AlertCard en MovimientoScreen si los nombres difieren.

- [ ] **Step 4: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/inventario/screens/MovimientoScreen.tsx
git add apps/mobile/hormigas_mobile/app/(branche)/[sucursalId]/movimiento.tsx
git commit -m "feat(mobile): MovimientoScreen con tipos fijos/combo + alertas"
```

---

## Task 11: Quitar mock BranchSummaryScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/home/components/BranchSummaryScreen.tsx`

- [ ] **Step 1: Reemplazar BranchSummaryScreen con datos reales**

```tsx
// apps/mobile/hormigas_mobile/src/home/components/BranchSummaryScreen.tsx
import DataTable from '@/src/utils/components/DataTable'
import { Building2 } from 'lucide-react-native'
import { Text, View, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { ValorInventarioDTO } from '@hormigas/application'
import { BranchItemListDTO } from '@hormigas/application'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { getReporteRepo } from '@/src/adapters/reporteServiceInstance'
import { getInventarioRepos } from '@/src/adapters/inventarioServiceInstance'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

type SucursalRow = {
  nombre: string
  valorInventario: string
  productosConPrecio: number
  productosSinPrecio: number
  stockBajo: number
  estado: string
}

const getStatusColor = (estado: string | number): string => {
  const n = String(estado).toLowerCase()
  if (n === 'optimo') return 'bg-blue-200 text-blue-600'
  if (n === 'atencion') return 'bg-orange-200 text-orange-600'
  return 'text-gray-500'
}

async function buildRow(branch: BranchItemListDTO): Promise<SucursalRow> {
  try {
    const reporteRepo = await getReporteRepo()
    const { sqlite } = await getInventarioRepos()
    const [reporte, inventario] = await Promise.all([
      reporteRepo.valorInventario(Number(branch.id)),
      sqlite.findBySucursal(Number(branch.id)),
    ])
    const stockBajo = inventario.filter(i => i.stockActual < i.stockMinimo).length
    return {
      nombre: branch.nombre,
      valorInventario: `$${reporte.valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      productosConPrecio: reporte.productosConPrecio,
      productosSinPrecio: reporte.productosSinPrecio,
      stockBajo,
      estado: stockBajo > 0 ? 'Atencion' : 'Optimo',
    }
  } catch {
    return {
      nombre: branch.nombre,
      valorInventario: 'N/A',
      productosConPrecio: 0,
      productosSinPrecio: 0,
      stockBajo: 0,
      estado: 'Optimo',
    }
  }
}

export default function BranchSummaryScreen() {
  const { branches } = useBranches()
  const { isOnline } = useNetwork()
  const [rows, setRows] = useState<SucursalRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (branches.length === 0) return
    setLoading(true)
    Promise.all(branches.map(buildRow))
      .then(setRows)
      .finally(() => setLoading(false))
  }, [branches, isOnline])

  if (loading) {
    return (
      <View className="border rounded-xl border-gray-200 p-6 items-center">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <DataTable
      title='Resumen por Sucursal'
      description='Vista general del inventario en cada ubicacion'
      icon={Building2}
      columns={[
        {
          key: 'nombre',
          label: 'Sucursal',
          render: val => (
            <View className='flex flex-row items-center gap-1'>
              <View className='rounded-xl bg-blue-100 p-1'>
                <Building2 size={24} color='#1d4ed8' />
              </View>
              <Text>{String(val)}</Text>
            </View>
          )
        },
        { key: 'productosConPrecio', label: 'Productos' },
        { key: 'stockBajo', label: 'Stock Bajo' },
        { key: 'valorInventario', label: 'Valor' },
        {
          key: 'estado',
          label: 'Estado',
          render: val => (
            <View>
              <Text className={`${getStatusColor(String(val))} rounded-xl p-1 text-center font-semibold`}>
                {String(val)}
              </Text>
            </View>
          )
        }
      ]}
      data={rows}
    />
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /home/uhernand/interfaz_hormigas
pnpm --filter hormigas_mobile tsc --noEmit 2>&1 | grep -i "BranchSummary\|error" | head -20
```
Expected: sin errores en BranchSummaryScreen.

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/home/components/BranchSummaryScreen.tsx
git commit -m "fix(home): quitar mock BranchSummaryScreen — conectar a API reportes"
```

---

## Task 12: Quitar mock LowStockSection

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx`

- [ ] **Step 1: Verificar interface ProductCardProps**

```bash
grep -n "interface\|type\|Props\|name\|sku\|stock\|location" /home/uhernand/interfaz_hormigas/apps/mobile/hormigas_mobile/src/utils/components/product/ProductCard.tsx | head -20
```

- [ ] **Step 2: Reemplazar LowStockSection con datos reales**

```tsx
// apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx
import ProductList from '@/src/utils/components/product/ProductList'
import { ProductCardProps } from '@/src/utils/components/product/ProductCard'
import { AlertTriangle } from 'lucide-react-native'
import { View, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { getInventarioRepos } from '@/src/adapters/inventarioServiceInstance'
import { useNetwork } from '@hormigas/mobile-shared/context/NetworkContext'

export default function LowStockSection() {
  const [products, setProducts] = useState<ProductCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const { isOnline } = useNetwork()

  useEffect(() => {
    const load = async () => {
      try {
        const { sqlite, api } = await getInventarioRepos()
        // Si online, intentar sync de todas las sucursales no es factible sin lista
        // Se usa solo el cache local para LowStock
        const lowStock = await sqlite.findLowStock()
        setProducts(
          lowStock.map(item => ({
            name: item.productoNombre,
            sku: String(item.productoId),
            location: item.sucursalNombre,
            category: '',
            stock: item.stockActual,
            maxStock: item.stockMaximo,
            status: item.stockActual === 0 ? 'Critico' : 'Bajo',
          }))
        )
      } catch (e) {
        console.warn('[LowStockSection]', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOnline])

  if (loading) {
    return (
      <View className="p-4 items-center">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ProductList
      title='Stock bajo'
      description='Productos que requieren reabastecimiento'
      icon={AlertTriangle}
      products={products}
    />
  )
}
```

Nota: El campo `status` en `ProductCardProps` puede tener valores distintos. Verificar en Step 1 y ajustar si difiere.

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/home/components/LowStockSection.tsx
git commit -m "fix(home): quitar mock LowStockSection — conectar a cache SQLite inventario"
```

---

## Task 13: Fix modal BranchesScreen

**Files:**
- Modify: `apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx`

- [ ] **Step 1: Analizar el bug del modal comentado**

El modal estaba comentado porque `updateBranch` recibía `data.direccion` incompleto. El tipo `CreateBranchScreen` retorna `BranchFormValues` (nombre, direccion, responsable, codigo, telefono, ciudad) pero `updateBranch` espera `BranchItemListDTO` (id, nombre, direccion, responsable, activa).

- [ ] **Step 2: Reemplazar BranchesScreen con modal funcional**

```tsx
// apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx
import BranchSummaryScreen from '@/src/home/components/BranchSummaryScreen'
import CreateBranchScreen from '@/src/branches/screens/CreateBranch'
import ButtonCustom from '@/src/utils/components/ButtonCustom'
import DataTable from '@/src/utils/components/DataTable'
import Modal from '@/src/utils/components/Modal'
import { statusClass } from '@/src/utils/helpers/ColorHerlper'
import useIsTablet from '@/src/utils/hooks/useIsTablet'
import { Building, Pencil, Power } from 'lucide-react-native'
import { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useBranches } from '@/src/utils/hooks/useBranch'
import { BranchItemTableDTO } from '@/interfaces/Branch'
import { BranchMapper } from '@/mappers/BranchMapper'
import { router } from 'expo-router'
import { BranchItemListDTO } from '@hormigas/application'

export default function BranchesScreen() {
  const [modal, setModal] = useState(false)
  const isTablet = useIsTablet()
  const [selectBranch, setSelectedBranch] = useState<BranchItemTableDTO | null>(null)
  const { branches, toggleStatus, updateBranch, createBranch } = useBranches()

  const mappedBranches: BranchItemTableDTO[] = branches.map(branch =>
    BranchMapper.toListTable(branch)
  )

  const handleClose = () => {
    setModal(false)
    setSelectedBranch(null)
  }

  return (
    <View>
      <View className='w-11/12 self-center gap-2'>
        <View
          className={`flex ${
            isTablet ? 'flex-row items-center justify-between' : 'flex-col gap-2'
          }`}
        >
          <View>
            <Text className='text-2xl font-bold'>Sucursales</Text>
            <Text className='text-gray-400'>
              Gestiona las sucursales de tu organizacion
            </Text>
          </View>
          <ButtonCustom title='+ Nueva Sucursal' onPress={() => setModal(true)} />
        </View>

        <DataTable
          title='Sucursales'
          icon={Building}
          columns={[
            {
              key: 'nombre',
              label: 'Nombre',
              render: (val, row) => (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(branche)/[sucursalId]/inventario',
                      params: { sucursalId: String(row.id), sucursalNombre: row.nombre },
                    })
                  }
                >
                  <Text className='text-blue-600 underline'>{String(val)}</Text>
                </TouchableOpacity>
              )
            },
            { key: 'direccion', label: 'Direccion' },
            { key: 'responsable', label: 'Responsable' },
            {
              key: 'activa',
              label: 'Estado',
              render: val => (
                <Text className={statusClass(val ? 'blue' : 'gray')}>
                  {val ? 'Activo' : 'Inactivo'}
                </Text>
              )
            },
            {
              key: 'acciones',
              label: 'Acciones',
              render: (_, row) => (
                <View className='flex flex-row gap-2'>
                  <ButtonCustom
                    onPress={() => {
                      setSelectedBranch(row)
                      setModal(true)
                    }}
                    bgColor='bg-blue-500'
                    icon={Pencil}
                    iconSize={18}
                    compact
                  />
                  <ButtonCustom
                    onPress={() => toggleStatus(row.id)}
                    bgColor={`${row.activa ? 'bg-green-500' : 'bg-red-500'}`}
                    icon={Power}
                    iconSize={18}
                    compact
                  />
                </View>
              )
            }
          ]}
          data={mappedBranches}
        />

        <BranchSummaryScreen />
      </View>

      <Modal isOpen={modal} onClose={handleClose}>
        <CreateBranchScreen
          defaultValues={
            selectBranch
              ? {
                  nombre: selectBranch.nombre,
                  direccion: selectBranch.direccion ?? '',
                  responsable: selectBranch.responsable ?? '',
                }
              : undefined
          }
          onSubmit={data => {
            if (selectBranch) {
              updateBranch({
                id: selectBranch.id,
                nombre: data.nombre,
                direccion: data.direccion,
                responsable: data.responsable,
                activa: selectBranch.activa,
              } as BranchItemListDTO)
            } else {
              createBranch({
                nombre: data.nombre,
                direccion: data.direccion,
                activa: true,
              })
            }
            handleClose()
          }}
        />
      </Modal>
    </View>
  )
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd /home/uhernand/interfaz_hormigas
pnpm --filter hormigas_mobile tsc --noEmit 2>&1 | grep -i "BranchesScreen\|error" | head -20
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
cd /home/uhernand/interfaz_hormigas
git add apps/mobile/hormigas_mobile/src/branches/screens/BranchesScreen.tsx
git commit -m "fix(branches): descomentar y reparar modal crear/editar sucursal"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Backend motivos ✓ | Domain schema ✓ | Application ports/DTOs ✓ | Infra impls ✓ | Adapters ✓ | Hooks ✓ | InventarioScreen ✓ | CreateInventario ✓ | MovimientoScreen ✓ | BranchSummary mock ✓ | LowStock mock ✓ | BranchesScreen modal ✓
- [x] **Placeholder scan:** Task 9 Step 2 nota sobre `listAll()` — se incluye verificación explícita. Task 10 Step 3 nota sobre AlertCard — se incluye verificación. Task 12 Step 1 nota sobre ProductCardProps — se incluye verificación.
- [x] **Type consistency:** `InventarioItemDTO` usada consistentemente en Tasks 2-8. `TipoMovimiento` definido en Task 2 y referenciado correctamente en Tasks 7, 8, 9, 10. `getInventarioRepos()` retorna `{ api, sqlite }` en Task 6 y usado así en Tasks 7, 11, 12.
