# Alcance futuro — Venta en línea (E-commerce)

> Análisis de lo que se necesita para extender el sistema Hormigas con una tienda online, dado que el inventario vive en sucursales físicas.

---

## Contexto

El sistema actual gestiona inventario distribuido en sucursales y registra ventas offline-first mediante el POS. La idea es exponer ese mismo catálogo e inventario a clientes externos a través de una tienda en línea.

La buena noticia: el modelo de movimientos ya está bien diseñado para soportarlo. La complicación real no es técnica sino operacional: el stock está en sucursales físicas que trabajan con modo offline, y un cliente online que compra algo espera que ese producto realmente exista y llegue.

---

## Lo que ya existe y es reusable

| Pieza actual | Rol en e-commerce |
|---|---|
| Tabla `producto` (SKU, precio, nombre) | Catálogo de la tienda |
| Tabla `inventario` (stock por sucursal) | Stock disponible para venta online |
| Tabla `movimiento` con tipos `VENTA`, `DEVOLUCION`, `TRASLADO_SALIDA` | Registro de salidas por pedido |
| `ApiHttpClient` + JWT | Base para endpoints públicos y autenticados |
| `POSService.syncPending()` → `POST /api/movimiento/crear` | El mismo endpoint puede recibir movimientos de pedidos online |

Una orden online confirmada equivale a un movimiento `VENTA` por cada producto del pedido. Eso ya está modelado.

---

## El problema central: reserva de stock

En el POS, la venta es instantánea — el cliente paga en el momento. En e-commerce existe un lapso entre "agregar al carrito" y "pago confirmado" que puede durar minutos u horas.

Sin reserva, dos clientes pueden comprar simultáneamente el último producto disponible. Ambos pagan, el sistema queda con stock negativo y uno de los dos recibe un mensaje de cancelación. Eso destruye la confianza en la tienda.

### Solución: tabla `reserva_stock`

```sql
CREATE TABLE reserva_stock (
  id          TEXT PRIMARY KEY,
  producto_id INTEGER NOT NULL,
  sucursal_id INTEGER NOT NULL,
  cantidad    INTEGER NOT NULL,
  orden_id    TEXT,                        -- NULL mientras está en carrito
  expira_en   TEXT NOT NULL,               -- ISO timestamp
  estado      TEXT NOT NULL DEFAULT 'ACTIVA', -- ACTIVA | CONFIRMADA | EXPIRADA
  creada_en   TEXT NOT NULL,
  FOREIGN KEY (producto_id) REFERENCES producto(id),
  FOREIGN KEY (sucursal_id) REFERENCES sucursal(id)
);
```

### Flujo con reserva

```
Cliente agrega al carrito
        │
        ▼
POST /api/reserva (producto_id, cantidad)
        │
        ├── ¿stock disponible - reservas activas > 0?
        │         SÍ → crea reserva con expira_en = ahora + 15 min
        │         NO → responde 409 "sin stock disponible"
        │
        ▼
Cliente inicia checkout y paga
        │
        ├── Pago exitoso
        │       → convierte reserva en movimiento VENTA
        │       → reserva.estado = CONFIRMADA
        │       → descuenta inventario real
        │
        └── Pago fallido / carrito abandonado
                → reserva expira automáticamente (job periódico)
                → stock disponible de nuevo
```

### Stock disponible real

El stock que se muestra al cliente online no es `inventario.stock_actual` directamente, sino:

```
stock_disponible = stock_actual - SUM(reservas ACTIVAS no expiradas)
```

Esto requiere que todos los endpoints de catálogo y checkout usen esa fórmula en lugar del stock crudo.

---

## El segundo problema: ¿qué sucursal despacha?

El inventario está distribuido. Una orden online necesita una decisión explícita de fulfillment antes de comprometer stock.

### Opciones (de menor a mayor complejidad)

**Opción A — Sucursal única de despacho online**
Se designa una sucursal como el "almacén e-commerce". Solo ese stock se expone online. Simple de implementar, limita la disponibilidad.

```
sucursal.es_almacen_online = true/false
```

**Opción B — Sucursal más cercana al cliente**
Al hacer checkout, el sistema elige la sucursal activa con stock suficiente más cercana al código postal del cliente. Requiere coordenadas o zonas por sucursal.

**Opción C — Máximo stock disponible**
El sistema elige automáticamente la sucursal con más stock del producto solicitado. No considera distancia, pero es fácil de implementar.

**Opción D — Split de pedido entre sucursales**
Un pedido con múltiples productos puede fulfillearse desde distintas sucursales. Máxima disponibilidad, mayor complejidad logística y de envío.

> **Recomendación para empezar:** Opción A o C. Decidir esto antes de construir porque afecta el schema, los endpoints y la lógica de reserva.

---

## Módulos nuevos en el backend

### 1. Catálogo público

Endpoints sin autenticación para que la tienda web consuma el catálogo.

```
GET  /api/tienda/productos              → lista paginada con stock_disponible
GET  /api/tienda/productos/{sku}        → detalle de producto
GET  /api/tienda/productos/categoria/{cat}
```

El catálogo actual (`producto`) solo tiene `nombre`, `sku`, `precio`, `categoria`. Para e-commerce se necesita también:
- Imágenes (URLs a S3 u otro storage)
- Descripción larga
- Atributos (talla, color, peso para envío)
- Estado visible en tienda (`publicado: true/false`)

### 2. Reservas

```
POST   /api/reserva               → crear reserva al agregar al carrito
DELETE /api/reserva/{id}          → liberar al vaciar carrito
GET    /api/reserva/carrito/{id}  → reservas activas de un carrito
```

Job periódico cada 5 minutos que expira reservas vencidas y libera stock.

### 3. Órdenes

```
POST /api/orden                   → crear orden desde carrito (pre-pago)
GET  /api/orden/{id}              → estado de una orden
POST /api/orden/{id}/confirmar    → webhook del payment gateway al pago exitoso
POST /api/orden/{id}/cancelar     → pago fallido o cancelación manual
```

Schema mínimo:

```sql
CREATE TABLE orden (
  id              TEXT PRIMARY KEY,
  cliente_id      TEXT,
  estado          TEXT NOT NULL,  -- PENDIENTE | PAGADA | EN_PROCESO | ENVIADA | ENTREGADA | CANCELADA
  total           REAL NOT NULL,
  direccion_envio TEXT NOT NULL,
  sucursal_id     INTEGER,        -- sucursal que despacha
  creada_en       TEXT NOT NULL,
  actualizada_en  TEXT NOT NULL
);

CREATE TABLE orden_item (
  id          TEXT PRIMARY KEY,
  orden_id    TEXT NOT NULL,
  producto_id INTEGER NOT NULL,
  cantidad    INTEGER NOT NULL,
  precio_unit REAL NOT NULL,      -- precio al momento de la compra, no el actual
  FOREIGN KEY (orden_id) REFERENCES orden(id)
);
```

### 4. Clientes (usuarios externos)

Los usuarios actuales son empleados con JWT. Los clientes de la tienda son un tipo distinto de usuario.

Opciones:
- Añadir `tipo: EMPLEADO | CLIENTE` a la tabla `usuario` existente
- Crear tabla `cliente` separada (más limpio, evita mezclar lógica de auth)

Necesitan: registro, login, recuperación de contraseña, historial de órdenes, direcciones guardadas.

### 5. Pagos

El backend recibe un webhook del payment gateway cuando el pago es exitoso y ejecuta:
1. Confirmar reservas → movimientos `VENTA`
2. Descontar `inventario.stock_actual`
3. Cambiar `orden.estado` a `PAGADA`
4. Disparar notificación al cajero/almacén de la sucursal que despacha

Gateways compatibles con México: **Stripe**, **MercadoPago**, **OpenPay**, **Conekta**.

---

## Storefront (frontend de la tienda)

El backend Spring Boot expone la API. La tienda en sí es una aplicación aparte.

| Opción | Ventaja | Desventaja |
|---|---|---|
| Next.js / Nuxt (SSR) | SEO nativo, rápido | Proyecto nuevo completo |
| Shopify / WooCommerce | Rápido de lanzar | No usa el backend propio, inventario duplicado |
| Expo Web (compartir paquetes) | Reutiliza `/packages` del monorepo | Limitado para SEO y experiencia web |

> **Recomendación:** Next.js consumiendo la API del backend. Se puede hospedar en Vercel. El backend Spring Boot se convierte en el API de inventario y órdenes, Next.js maneja el storefront y el checkout.

El monorepo actual puede extenderse:

```
hormigas_interfaz/
├── apps/
│   ├── mobile/hormigas_mobile/
│   ├── mobile/hormigas_POS/
│   └── web/hormigas_store/     ← Next.js (nuevo)
└── packages/
    ├── domain/                 ← compartido
    ├── application/            ← compartido
    └── infrastructure/         ← compartido
```

---

## Prerequisito operacional (el más importante)

Antes de lanzar e-commerce, el inventario en sucursales debe ser **confiable y en tiempo real**. Si las sucursales trabajan offline durante horas o días sin sincronizar, el stock que ve el cliente online puede ser incorrecto.

Escenarios problemáticos:

- Sucursal sin internet por 2 horas. Un cliente online compra 5 unidades. La sucursal vendió esas mismas unidades offline durante ese tiempo. Al sincronizar, stock queda negativo.
- La sucursal sincroniza los movimientos offline, el servidor los aplica, pero el cliente online ya tiene una orden confirmada de un producto que ya no existe.

**Soluciones posibles:**

1. **Buffer de seguridad:** exponer online solo el 80% del stock real. Reduce el riesgo sin cambios de arquitectura.
2. **Solo sucursales siempre conectadas despachan online:** si la sucursal pierde conexión por más de X minutos, se marca como no disponible para e-commerce hasta reconectarse.
3. **Inventario dedicado e-commerce:** una parte del stock se reserva exclusivamente para ventas online y no es tocable por el POS. Requiere un campo adicional en `inventario`.

---

## Fases de implementación sugeridas

### Fase 1 — Catálogo online (sin venta)
- Endpoint público de productos con stock disponible
- Añadir campos de e-commerce al producto: imagen, descripción larga, publicado
- Storefront básico en Next.js: lista, detalle de producto
- **Sin carrito ni pago — solo vitrina**

### Fase 2 — Carrito y reservas
- Tabla `reserva_stock` y sus endpoints
- Carrito en el storefront (estado local o sesión)
- Fórmula `stock_disponible = stock_actual - reservas_activas`
- Job de expiración de reservas

### Fase 3 — Checkout y pago
- Tabla `orden` y `orden_item`
- Integración con payment gateway (webhook)
- Al confirmar pago: reserva → movimiento VENTA → descontar inventario
- Notificación a la sucursal de despacho

### Fase 4 — Clientes y postventa
- Registro y login de clientes
- Historial de órdenes
- Flujo de devolución (`movimiento.tipo = DEVOLUCION`)
- Panel de administración de órdenes para el almacén

---

## Preguntas que hay que responder antes de construir

1. **¿Qué sucursal(es) despachan pedidos online?** ¿Una sola, varias, o routing automático?
2. **¿Las sucursales que despachan online están siempre conectadas?** Esto determina el riesgo de inconsistencia de stock.
3. **¿Se necesita envío a domicilio o solo pickup en sucursal?** Cambia el flujo de fulfillment completamente.
4. **¿Los clientes online son distintos de los empleados del sistema?** Determina si se crea tabla `cliente` separada o se extiende `usuario`.
5. **¿Qué gateway de pago?** Stripe si hay clientes internacionales, MercadoPago o Conekta si es solo México.
6. **¿El catálogo online es todo el catálogo o una selección?** Requiere campo `publicado_en_tienda` en `producto`.

---

*Este documento forma parte del backlog de Hormigas. La Fase 1 puede iniciarse sin resolver todas las preguntas anteriores — el catálogo de solo lectura es independiente de las decisiones de fulfillment y pago.*
