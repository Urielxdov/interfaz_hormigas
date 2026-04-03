# 🐜 Hormigas

> Sistema de inventarios con soporte offline-first para gestión de empresas, sucursales y productos.

---

## 📋 Descripción general

**Hormigas** es un monorepo que alberga las aplicaciones cliente del sistema de inventarios, compartiendo lógica de negocio común entre ellas. El sistema está diseñado bajo un principio **offline-first**: si hay conexión a internet, los datos se persisten directamente en la nube a través de la API; si no la hay, se almacenan localmente en SQLite y se sincronizan en cuanto se restablece la conexión mediante **cargas batch**.

La sincronización se controla mediante una **bandera booleana por registro** (`synced`). Esta bandera solo cambia a `true` cuando el servidor responde con un `HTTP 200`. Si la respuesta falla o no llega, el registro permanece marcado como pendiente hasta el próximo intento de sincronización.

---

## 🏗️ Arquitectura del sistema

### Flujo de almacenamiento offline / online

```
┌─────────────────────────────────────────────────┐
│                  App Cliente                    │
│            (React Native / Electron)            │
└──────────────────────┬──────────────────────────┘
                       │
              ¿Hay conexión?
             /                \
           SÍ                  NO
           │                    │
           ▼                    ▼
  ┌─────────────────┐   ┌───────────────────┐
  │   API REST      │   │  SQLite Local     │
  │  (PostgreSQL)   │   │  synced = false   │
  └────────┬────────┘   └────────┬──────────┘
           │                     │
     HTTP 200?          Conexión restaurada
     /      \                    │
   SÍ        NO                  ▼
   │          │         ┌─────────────────┐
   ▼          ▼         │  Carga Batch    │
synced=true  sin        │  → API REST     │
             cambio     └────────┬────────┘
                                 │
                           HTTP 200?
                           /      \
                         SÍ        NO
                         │          │
                    synced=true   sin cambio
                                 (reintento)
```

### Modelo de datos principal

```
Empresa
  └── Sucursal (N por empresa)
        ├── Inventario (ligado a la sucursal)
        └── Producto (N por sucursal)
```

### Estructura del monorepo

```
hormigas/
├── apps/
│   ├── mobile/          # App React Native (activa)
│   └── desktop/         # App Electron (futuro alcance)
├── packages/            # Lógica de negocio compartida
│   ├── application/     # Casos de uso y lógica de negocio
│   └── domain/          # Entidades core del sistema
├── package.json
└── README.md
```

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| App móvil | React Native + TypeScript |
| App desktop | Electron *(futuro)* |
| Base de datos local | SQLite |
| Base de datos nube | PostgreSQL |
| Lógica compartida | `/packages` manual (application + domain) |

---

## 🗺️ Roadmap

### ✅ En desarrollo
- [x] Monorepo base con estructura `/packages` (application + domain)
- [x] App React Native — gestión de empresas
- [x] App React Native — gestión de sucursales
- [x] App React Native — gestión de inventarios y productos
- [x] Almacenamiento local con SQLite
- [x] Mecanismo de sincronización offline con bandera `synced`

### 🔄 En proceso
- [ ] Carga batch automática al recuperar conexión
- [ ] Manejo de conflictos en sincronización
- [ ] App de **Punto de Venta (POS)** — gestión de movimientos de inventario

### 🔮 Futuro alcance
- [ ] App Electron (desktop) compartiendo lógica de `/packages`
- [ ] Dashboard web de administración
- [ ] Reportes y exportación de inventario
- [ ] Soporte multi-usuario con roles por sucursal

---

## 📦 Instalación

> Requisitos previos: Node.js, npm/yarn, entorno React Native configurado.

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/hormigas.git
cd hormigas

# Instalar dependencias
npm install

# Iniciar la app móvil
cd apps/mobile
npm run android   # o npm run ios
```

---

## 📝 Notas de desarrollo

- La bandera `synced` **nunca se cambia a `true` en el cliente** si el servidor no confirma con `HTTP 200`.
- Todos los modelos y tipos viven en `/packages/domain` y los casos de uso en `/packages/application` para garantizar consistencia entre apps.
- La app de Punto de Venta será donde el modo offline cobra mayor relevancia, dado el volumen de movimientos en sucursales sin conexión estable.

---

*Proyecto en desarrollo activo. 🐜*
