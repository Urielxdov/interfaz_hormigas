# Arquitectura de capas

El proyecto sigue una arquitectura en capas inspirada en Clean Architecture. Cada capa tiene responsabilidades claras y solo depende de las capas internas.

---

## Diagrama de dependencias

```
┌─────────────────────────────────────────────────────┐
│                   app (mobile / POS)                │
│  screens, hooks, adapters, reducers, navigación     │
└───────────────────────┬─────────────────────────────┘
                        │ usa
┌───────────────────────▼─────────────────────────────┐
│              @hormigas/infrastructure               │
│  SqliteProductRepositoryImpl, ApiHttpClient, etc.   │
└───────────────────────┬─────────────────────────────┘
                        │ implementa interfaces de
┌───────────────────────▼─────────────────────────────┐
│               @hormigas/application                 │
│  ProductService, SaleService, puertos, DTOs         │
└───────────────────────┬─────────────────────────────┘
                        │ usa entidades de
┌───────────────────────▼─────────────────────────────┐
│                 @hormigas/domain                    │
│  Product, Branch, User, Sale, CREATE_TABLES_SQL     │
└─────────────────────────────────────────────────────┘
```

La regla es simple: **ninguna capa importa de una capa superior**. `domain` no sabe que existe `infrastructure`. `application` no sabe que existe `expo-sqlite`.

---

## Capa: `@hormigas/domain`

Contiene las entidades del negocio y el esquema de base de datos. No tiene dependencias externas.

**Qué va aquí:**
- Interfaces TypeScript de entidades (`Product`, `Branch`, `Sale`, `User`, etc.)
- El DDL completo de SQLite (`CREATE_TABLES_SQL`)
- Enums o tipos de valor del dominio (ej. `TypeTransaction`)

**Qué NO va aquí:**
- Lógica de negocio (casos de uso)
- Acceso a base de datos o red
- Dependencias de React Native / Expo

**Ejemplo:**
```ts
// packages/domain/entities/product/Product.ts
export interface Product {
  localId: string
  nombre: string
  sku: string
  precio?: number
  activo: boolean
  categoria?: string
}
```

---

## Capa: `@hormigas/application`

Contiene la lógica de negocio y define los contratos (puertos) que la infraestructura debe implementar. No tiene acceso directo a SQLite ni a `fetch`.

**Qué va aquí:**
- Servicios de dominio (`ProductService`, `SaleService`)
- Interfaces de repositorios (`IProductRepository`, `ISyncQueueRepository`)
- Puertos de API (`IApiProductRepository`, `IApiUserRepository`, `IApiBranchRepository`)
- DTOs de entrada/salida (`CreateProductDTO`, `BranchItemListDTO`, `UsuarioResponseDTO`)
- Casos de uso que orquestan operaciones

**Qué NO va aquí:**
- Importaciones de `expo-sqlite`, `fetch`, `AsyncStorage`
- Clases concretas que toquen IO
- Lógica de UI o estado de React

**Ejemplo — contrato de repositorio:**
```ts
// packages/application/repositories/product.repository.ts
export interface IProductRepository {
  findAll(): Promise<Product[]>
  save(product: Product, synced?: boolean): Promise<boolean>
  markAsSynced(localId: string, serverId: number): Promise<boolean>
}
```

**Ejemplo — puerto de API:**
```ts
// packages/application/port/branch-api.port.ts
export interface IApiBranchRepository {
  listar(): Promise<BranchItemListDTO[]>
  crear(dto: CreateBranchDTO): Promise<BranchItemListDTO>
}
```

---

## Capa: `@hormigas/infrastructure`

Implementa los contratos definidos en `application`. Aquí vive todo el IO: consultas SQL, llamadas HTTP, mappers de filas de BD.

**Qué va aquí:**
- Implementaciones de repositorios SQLite (`SqliteProductRepositoryImpl`, `SqliteBranchRepositoryImpl`, etc.)
- Implementaciones de repositorios API (`ApiProductRepositoryImpl`, `ApiUserRepositoryImpl`, etc.)
- `ApiHttpClient` — fetch con Bearer token
- `TokenServiceImpl` — manejo de JWT con `expo-secure-store`
- Mappers de filas SQL a entidades de dominio

**Qué NO va aquí:**
- Lógica de negocio (no decidir qué hacer con los datos)
- Estado de React (no `useState`, no `useReducer`)
- Código específico de Expo Router o navegación

**Ejemplo — implementación SQLite:**
```ts
// packages/infrastructure/src/branch/SqliteBranchRepositoryImpl.ts
export class SqliteBranchRepositoryImpl {
  constructor(private db: DatabaseClient) {}

  async findAll(): Promise<BranchItemListDTO[]> {
    const rows = await this.db.getMany<SucursalRow>('SELECT * FROM sucursal ORDER BY nombre ASC')
    return rows.map(toDTO)
  }

  async upsertMany(items: BranchItemListDTO[]): Promise<void> {
    for (const item of items) {
      await this.db.run(
        'INSERT OR REPLACE INTO sucursal (id, nombre, direccion, activa) VALUES (?, ?, ?, ?)',
        [Number(item.id), item.nombre, item.direccion ?? null, item.activa ? 1 : 0]
      )
    }
  }
}
```

---

## Capa: app (hormigas_mobile / hormigas_POS)

La capa más externa. Ensambla las capas inferiores, gestiona estado de UI y define la navegación.

**Qué va aquí:**
- Pantallas (screens)
- Hooks de UI (`useProducts`, `useBranches`, `useUsuarios`)
- Reducers de estado local (`productReducer`, `branchReducer`, `userReducer`)
- Adapters/singletons que instancian repos (`getProductService`, `getBranchRepos`, `getUserRepos`)
- Componentes React Native reutilizables

**Qué NO va aquí:**
- SQL directo
- Lógica de negocio compleja (mover a `application`)
- Llamadas HTTP directas (usar repos de `infrastructure`)

**Adapters — patrón singleton:**

Los adapters instancian los repos una sola vez y los reúsan durante toda la sesión:

```ts
// src/adapters/branchRepoInstance.ts
let _repos: BranchRepos | null = null

export const getBranchRepos = (): Promise<BranchRepos> => {
  if (_repos) return Promise.resolve(_repos)
  // lazy init: abre DB, crea repos, cachea
  _initPromise = (async () => { ... })()
  return _initPromise
}
```

---

## Tabla resumen

| Capa | Paquete / ubicación | Depende de | Ejemplo de clase |
|------|---------------------|-----------|-----------------|
| Domain | `@hormigas/domain` | nada | `Product`, `Sale` |
| Application | `@hormigas/application` | domain | `ProductService`, `IProductRepository` |
| Infrastructure | `@hormigas/infrastructure` | application, domain | `SqliteProductRepositoryImpl`, `ApiHttpClient` |
| App | `apps/mobile/*/src` | infrastructure, application | `useProducts`, `CreateBranchScreen` |

---

## Agregar una nueva entidad — lista de verificación de capas

Cuando se agrega una entidad nueva (ej. `Proveedor`), el orden correcto es:

1. **domain** — definir la entidad TypeScript y agregar tabla al `CREATE_TABLES_SQL`
2. **application** — definir el DTO, el puerto de API (`IApiProveedorRepository`), y el repositorio local (`IProveedorRepository`)
3. **infrastructure** — implementar `SqliteProveedorRepositoryImpl` y `ApiProveedorRepositoryImpl`
4. **app** — crear adapter singleton, reducer con `SET | CREATE | UPDATE`, hook con patrón offline-first

Ver `docs/offline-first.md` para la guía detallada del patrón del hook.
