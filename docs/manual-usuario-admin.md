# Manual de Usuario — Administrador de Empresa
**Hormigas Mobile**

---

## Índice

1. [Introducción](#1-introducción)
2. [Inicio de sesión](#2-inicio-de-sesión)
3. [Pantalla de inicio (Dashboard)](#3-pantalla-de-inicio-dashboard)
4. [Sucursales](#4-sucursales)
   - 4.1 [Ver sucursales](#41-ver-sucursales)
   - 4.2 [Crear sucursal](#42-crear-sucursal)
   - 4.3 [Editar sucursal](#43-editar-sucursal)
   - 4.4 [Activar / desactivar sucursal](#44-activar--desactivar-sucursal)
   - 4.5 [Detalle de sucursal](#45-detalle-de-sucursal)
5. [Inventario](#5-inventario)
   - 5.1 [Ver inventario de una sucursal](#51-ver-inventario-de-una-sucursal)
   - 5.2 [Agregar producto al inventario](#52-agregar-producto-al-inventario)
   - 5.3 [Estados de stock](#53-estados-de-stock)
6. [Movimientos](#6-movimientos)
   - 6.1 [Historial de movimientos](#61-historial-de-movimientos)
   - 6.2 [Registrar movimiento desde inventario](#62-registrar-movimiento-desde-inventario)
   - 6.3 [Registrar movimiento general](#63-registrar-movimiento-general)
   - 6.4 [Tipos de movimiento](#64-tipos-de-movimiento)
7. [Productos](#7-productos)
   - 7.1 [Ver catálogo de productos](#71-ver-catálogo-de-productos)
   - 7.2 [Crear producto](#72-crear-producto)
   - 7.3 [Editar producto](#73-editar-producto)
   - 7.4 [Activar / desactivar producto](#74-activar--desactivar-producto)
   - 7.5 [Detalle y analíticas del producto](#75-detalle-y-analíticas-del-producto)
8. [Categorías](#8-categorías)
   - 8.1 [Ver categorías](#81-ver-categorías)
   - 8.2 [Crear categoría](#82-crear-categoría)
   - 8.3 [Activar / desactivar categoría](#83-activar--desactivar-categoría)
9. [Usuarios](#9-usuarios)
   - 9.1 [Ver usuarios](#91-ver-usuarios)
   - 9.2 [Crear usuario](#92-crear-usuario)
10. [Sincronización](#10-sincronización)
11. [Permisos del administrador](#11-permisos-del-administrador)

---

## 1. Introducción

**Hormigas Mobile** es una aplicación de gestión de inventario diseñada para operar en entornos con conectividad limitada. Funciona en modo **offline-first**: los datos se guardan localmente en el dispositivo y se sincronizan con el servidor cuando hay conexión a internet.

Como **Administrador de Empresa** tienes acceso completo a:

- Gestión de sucursales
- Gestión del catálogo de productos y categorías
- Control de inventario por sucursal
- Registro y seguimiento de movimientos
- Administración de usuarios de tu empresa

---

## 2. Inicio de sesión

1. Abre la aplicación **Hormigas**.
2. Ingresa tu **correo electrónico** y **contraseña**.
3. Presiona **Iniciar sesión**.

La aplicación te redirige automáticamente al **Dashboard** principal tras autenticarte correctamente.

> Si olvidaste tu contraseña, contacta al administrador del sistema.

---

## 3. Pantalla de inicio (Dashboard)

La pantalla de inicio te muestra un resumen general de tu empresa.

### Métricas principales

| Métrica | Descripción |
|---|---|
| **Productos activos** | Total de productos habilitados en el catálogo |
| **Sucursales activas** | Total de sucursales operando |
| **Pendientes de sincronizar** | Registros en espera de enviarse al servidor |

### Alertas de stock bajo

Debajo de las métricas aparece una lista de productos que están por debajo de su stock mínimo configurado. Úsala como referencia para reabastecer sucursales.

### Resumen por sucursal

Muestra una tarjeta por cada sucursal con actividad reciente. Presiona una tarjeta para ir directamente al detalle de esa sucursal.

### Botones del encabezado

| Botón | Acción |
|---|---|
| **Sincronizar** (ícono centro-arriba) | Envía los registros pendientes al servidor. Muestra el conteo de pendientes. |
| **Cerrar sesión** (ícono arriba-derecha) | Cierra tu sesión y regresa a la pantalla de login. |

---

## 4. Sucursales

Accede desde la pestaña **Sucursales** en la barra de navegación inferior.

### 4.1 Ver sucursales

La pantalla muestra una tabla con todas las sucursales de tu empresa:

| Columna | Descripción |
|---|---|
| **Nombre** | Nombre de la sucursal |
| **Dirección** | Ubicación física |
| **Responsable** | Usuario encargado asignado |
| **Activa** | Estado: verde *Activa* / gris *Inactiva* |
| **Acciones** | Botones para ver, editar y cambiar estado |

### 4.2 Crear sucursal

1. Presiona **+ Nueva Sucursal** (parte superior derecha).
2. Completa el formulario:

| Campo | Requerido | Descripción |
|---|---|---|
| **Nombre** | Sí | Nombre identificador de la sucursal |
| **Dirección** | No | Dirección física |
| **Código** | No | Código interno (se convierte a mayúsculas automáticamente) |
| **Teléfono** | No | Número de contacto (solo dígitos) |
| **Ciudad** | No | Ciudad donde se ubica |
| **Encargado** | No | Selecciona un usuario de la lista como responsable |

3. Presiona **Guardar**.

### 4.3 Editar sucursal

1. Localiza la sucursal en la tabla.
2. Presiona el ícono de **lápiz** (editar) en la columna de acciones.
3. Modifica los campos necesarios.
4. Presiona **Guardar**.

### 4.4 Activar / desactivar sucursal

1. Localiza la sucursal en la tabla.
2. Presiona el ícono de **encendido** (Power) en la columna de acciones.
3. El estado cambia entre *Activa* e *Inactiva* inmediatamente.

> Las sucursales inactivas no aparecen disponibles para nuevos movimientos de inventario.

### 4.5 Detalle de sucursal

1. Presiona el ícono de **ojo** sobre la sucursal deseada.

La pantalla de detalle muestra:

- **Estadísticas generales**: total de inventarios, entradas y salidas registradas.
- **Stock bajo**: productos en esa sucursal que están por debajo del mínimo. Si todo está bien, aparece un indicador verde.
- **Movimientos recientes**: los últimos 10 movimientos registrados en la sucursal.
- **Inventario completo**: lista de todos los productos con su stock actual y máximo.

---

## 5. Inventario

El inventario está vinculado a cada sucursal. Para acceder:

1. Ve a la pestaña **Sucursales**.
2. Presiona el **nombre** de la sucursal deseada.

### 5.1 Ver inventario de una sucursal

Muestra una cuadrícula de tarjetas, una por cada producto registrado en esa sucursal. Cada tarjeta incluye:

- Nombre del producto
- Precio
- Insignia de estado de stock (*Crítico*, *Bajo* u *OK*)
- Stock actual, mínimo y máximo
- Botones de acción rápida: **Venta**, **Compra**, **Otro**

Desliza hacia abajo para actualizar los datos.

### 5.2 Agregar producto al inventario

1. Presiona **+ Agregar** (parte superior).
2. Completa el formulario:

| Campo | Requerido | Descripción |
|---|---|---|
| **Producto** | Sí | Selecciona de la lista de productos activos (filtrables por categoría) |
| **Stock inicial** | Sí | Cantidad con la que inicia el producto en esta sucursal |
| **Stock mínimo** | Sí | Nivel mínimo antes de recibir alerta de stock bajo |
| **Stock máximo** | Sí | Capacidad máxima para este producto en la sucursal |

3. Presiona **Guardar**.

### 5.3 Estados de stock

| Estado | Color | Condición |
|---|---|---|
| **Crítico** | Rojo | Stock igual a 0 |
| **Bajo** | Naranja | Stock menor al mínimo configurado |
| **OK** | Verde | Stock dentro del rango normal |

---

## 6. Movimientos

Los movimientos registran todas las entradas y salidas de inventario.

### 6.1 Historial de movimientos

Accede desde la pestaña **Movimientos** en la barra inferior.

Muestra una lista de todos los movimientos de la empresa con:

- Nombre del producto
- Sucursal
- Cantidad (verde = entrada, rojo = salida)
- Usuario que lo registró
- Fecha
- Referencia (si se capturó)

**Filtros disponibles:**

- Filtrar por sucursal usando el selector desplegable
- Presiona **Ver todas** para quitar el filtro

Usa los botones **Anterior / Siguiente** para navegar entre páginas.

### 6.2 Registrar movimiento desde inventario

Desde la tarjeta del producto en el inventario de una sucursal:

| Botón | Tipo de movimiento |
|---|---|
| **Venta** | Salida (SALIDA preseleccionada) |
| **Compra** | Entrada (ENTRADA preseleccionada) |
| **Otro** | Libre — elige el tipo manualmente |

Completa el formulario de movimiento:

| Campo | Requerido | Descripción |
|---|---|---|
| **Tipo** | Sí | ENTRADA o SALIDA (botones de alternancia) |
| **Cantidad** | Sí | Número positivo mayor a 0 |
| **Referencia** | No | Texto libre, máximo 100 caracteres |
| **Motivo** | No | Selecciona entre opciones predefinidas si están disponibles |

> Para salidas: la cantidad no puede superar el stock actual disponible.

Presiona **Registrar movimiento** para guardar.

### 6.3 Registrar movimiento general

Desde la pestaña **Movimientos**:

1. Presiona **+ Registrar** (parte superior).
2. Completa el formulario:

| Campo | Requerido | Descripción |
|---|---|---|
| **Sucursal** | Sí | Selecciona la sucursal (buscable) |
| **Producto** | Sí | Selecciona el producto en esa sucursal (se carga al elegir sucursal) |
| **Tipo de movimiento** | Sí | Ver tabla de tipos abajo |
| **Cantidad** | Sí | Número positivo |
| **Referencia** | No | Máximo 100 caracteres |

3. Presiona **Registrar**.

### 6.4 Tipos de movimiento

| Tipo | Dirección | Descripción |
|---|---|---|
| **Venta** | Salida | Venta a cliente |
| **Compra** | Entrada | Compra a proveedor |
| **Merma** | Salida | Producto dañado o vencido |
| **Devolución** | Variable | Devolución de cliente o a proveedor |
| **Ajuste** | Variable | Corrección de inventario |
| **Traslado entrada** | Entrada | Recibe producto de otra sucursal |
| **Traslado salida** | Salida | Envía producto a otra sucursal |

---

## 7. Productos

Accede desde la pestaña **Productos** en la barra inferior.

### 7.1 Ver catálogo de productos

Muestra una tabla con todos los productos de la empresa.

**Métrica visible:** Stock total acumulado de todos los productos.

**Filtros disponibles:**

- **Búsqueda por nombre o SKU**: escribe en el campo de texto.
- **Filtro por categoría**: presiona las pastillas horizontales (una por categoría). Presiona *Todas* para quitar el filtro.

La tabla muestra 20 productos por página. Usa los botones **Anterior / Siguiente** para navegar.

| Columna | Descripción |
|---|---|
| **Nombre** | Nombre del producto |
| **SKU** | Código único del producto |
| **Categoría** | Categoría asignada |
| **Precio** | Precio unitario |
| **Stock** | Stock total |
| **Estado** | *Activo* (azul) o *Inactivo* (gris) |
| **Acciones** | Analíticas, editar, cambiar estado |

### 7.2 Crear producto

1. Presiona **+ Nuevo Producto** (parte superior).
2. Completa el formulario:

**Información básica:**

| Campo | Requerido | Descripción |
|---|---|---|
| **Nombre** | Sí | Nombre del producto |
| **SKU** | Sí | Código único (se convierte a mayúsculas automáticamente) |
| **Precio** | Sí | Precio unitario en formato decimal |
| **Estado** | Sí | Activar o desactivar el producto desde su creación |
| **Control de inventario** | No | Activa el seguimiento con stock mínimo y máximo |
| **Categoría** | Sí | Selecciona de la lista de categorías activas |

**Control de inventario** (si está habilitado):

| Campo | Requerido | Descripción |
|---|---|---|
| **Stock mínimo** | Sí | Umbral de alerta de stock bajo |
| **Stock máximo** | Sí | Límite máximo de existencias |

3. Presiona **Guardar**.

> Si el SKU o nombre ya existe en un producto inactivo, la aplicación te preguntará si deseas reactivarlo en lugar de crear uno nuevo.

### 7.3 Editar producto

1. Localiza el producto en la tabla.
2. Presiona el ícono de **lápiz**.
3. Modifica los campos necesarios.
4. Presiona **Guardar**.

### 7.4 Activar / desactivar producto

1. Localiza el producto en la tabla.
2. Presiona el ícono de **encendido** (Power).
3. El estado cambia inmediatamente.

> Los productos inactivos no pueden agregarse a nuevos inventarios ni registrar movimientos.

### 7.5 Detalle y analíticas del producto

1. Localiza el producto en la tabla.
2. Presiona el ícono de **gráfica** (columna de acciones).

La pantalla de detalle muestra:

- **Selector de sucursal**: filtra la información por sucursal o ve todas a la vez.
- **Por cada sucursal seleccionada:**
  - Stock e información del producto en esa sucursal
  - **Gráfica de movimientos** (barras): entradas vs. salidas por día
  - **Gráfica de stock** (línea): evolución del nivel de stock en el tiempo
  - **Indicador de tendencia**: variación porcentual respecto a la semana anterior

---

## 8. Categorías

Las categorías permiten organizar y filtrar el catálogo de productos.

Accede desde la pestaña **Productos** → botón **Categorías** (parte superior).

### 8.1 Ver categorías

Lista de todas las categorías de la empresa. Cada tarjeta muestra:

- Nombre
- Descripción (si se capturó)
- Botón de estado (Activa / Inactiva)
- Contador total de categorías

### 8.2 Crear categoría

1. Presiona **+ Nueva** (parte superior derecha).
2. Completa el formulario:

| Campo | Requerido | Límite | Descripción |
|---|---|---|---|
| **Nombre** | Sí | 50 caracteres | Nombre de la categoría |
| **Descripción** | No | 200 caracteres | Descripción opcional |

Los contadores de caracteres se muestran en tiempo real.

3. Presiona **Guardar**.

### 8.3 Activar / desactivar categoría

1. Presiona el botón de estado en la tarjeta de la categoría.
2. El estado cambia entre *Activa* e *Inactiva* inmediatamente.

> Las categorías inactivas no aparecen disponibles al crear o editar productos.

---

## 9. Usuarios

Accede desde la pestaña **Usuarios** en la barra inferior.

### 9.1 Ver usuarios

Muestra todos los usuarios de tu empresa en tarjetas. Cada tarjeta incluye:

- Nombre
- Correo electrónico
- Estado: *Activo* (verde) o *Inactivo* (gris)
- Sucursal asignada (si tiene una)

### 9.2 Crear usuario

1. Presiona **+ Nuevo** (parte superior).
2. Completa el formulario:

| Campo | Requerido | Descripción |
|---|---|---|
| **Nombre** | Sí | Nombre completo del usuario |
| **Correo** | Sí | Correo electrónico (será su usuario de acceso) |
| **Contraseña** | Sí | Contraseña inicial de acceso |
| **Sucursal** | No | ID numérico de la sucursal que tendrá asignada |

3. Presiona **Guardar**.

> Los usuarios nuevos tienen permisos de operador. Solo el administrador puede gestionar productos, sucursales y categorías.

---

## 10. Sincronización

Hormigas funciona en modo **offline-first**: puedes registrar movimientos, crear productos y gestionar inventario sin conexión a internet. Los datos se guardan localmente en el dispositivo.

### Cómo sincronizar

1. Asegúrate de tener conexión a internet.
2. Presiona el botón de **sincronización** en el encabezado del Dashboard.
3. La aplicación envía todos los registros pendientes al servidor.

### Indicadores de sincronización

| Indicador | Significado |
|---|---|
| **Número en el botón de sync** | Cantidad de registros pendientes de enviar |
| **Aviso en detalle de producto** | El producto aún no ha sido sincronizado |
| **Aviso de sin conexión** | No hay internet disponible en este momento |

> Se recomienda sincronizar al menos una vez al día o antes de cerrar la aplicación.

---

## 11. Permisos del administrador

Como **Administrador de Empresa** tienes acceso completo a todas las funciones descritas en este manual.

| Función | Operador | Administrador |
|---|---|---|
| Ver Dashboard | ✓ | ✓ |
| Ver sucursales | ✓ | ✓ |
| Crear / editar sucursales | ✗ | ✓ |
| Activar / desactivar sucursales | ✗ | ✓ |
| Ver inventario | ✓ | ✓ |
| Agregar producto a inventario | ✓ | ✓ |
| Registrar movimientos | ✓ | ✓ |
| Ver historial de movimientos | ✓ | ✓ |
| Ver catálogo de productos | ✓ | ✓ |
| Crear / editar productos | ✗ | ✓ |
| Activar / desactivar productos | ✗ | ✓ |
| Ver analíticas de producto | ✓ | ✓ |
| Gestionar categorías | ✗ | ✓ |
| Ver usuarios | ✓ | ✓ |
| Crear usuarios | ✗ | ✓ |

---

*Manual generado para Hormigas Mobile — versión 1.0*
