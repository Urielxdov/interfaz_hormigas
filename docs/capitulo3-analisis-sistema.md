# Capítulo III. Análisis de Sistema

El tercer capítulo del trabajo se enfoca en el análisis del sistema de la plataforma a desarrollar. Comienza con una descripción detallada de los requerimientos funcionales y no funcionales que se deben cumplir. Luego se presentan diferentes diagramas para visualizar la estructura del sistema y sus interacciones, incluyendo el diagrama de modelado, modelo de negocios, diagrama de casos de uso, diagrama de entidad relación y el diagrama de componentes. Todo esto con el objetivo de comprender y definir claramente los requisitos del sistema y su estructura para su posterior desarrollo.

---

## 3.1 Requerimientos funcionales y no funcionales

Los requerimientos funcionales son las funciones y características que se espera que el software cumpla y realice, mientras que los requerimientos no funcionales son las restricciones y limitaciones que deben ser consideradas, como la seguridad, el rendimiento y la usabilidad.

---

### RF1: Autenticación de usuarios

El código de requerimiento RF1 se refiere a la autenticación de usuarios en la aplicación móvil mediante un proceso de inicio de sesión basado en tokens JWT.

**Tabla 3.1 Descripción RF1**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RF1 |
| Nombre | Autenticación de usuarios |
| Propósito | Autenticar el acceso de los usuarios a la aplicación móvil por medio de un Login seguro. |
| Descripción | La primera vista al abrir la aplicación será la pantalla de inicio de sesión. El usuario ingresará sus credenciales (usuario y contraseña); si son validadas correctamente se generará un token JWT y se redirigirá al usuario a la pantalla correspondiente según su rol (SuperAdmin, Administrador de empresa o usuario estándar). |
| Entrada | Formulario de inicio de sesión (usuario y contraseña). |
| Salida | Token JWT almacenado localmente y redirección de pantalla de acuerdo con el rol del usuario. |
| Prioridad | Alta |

---

### REQUERIMIENTOS FUNCIONALES PARA SUPERADMINISTRADOR

---

### RF2: Gestión de empresas

El código de requerimiento RF2 se refiere a la funcionalidad que permite al SuperAdministrador registrar y visualizar las empresas que utilizan la plataforma.

**Tabla 3.2 Descripción RF2**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RF2 |
| Nombre | Gestión de empresas |
| Propósito | Registrar y listar las empresas habilitadas dentro de la plataforma. |
| Descripción | El SuperAdministrador podrá registrar nuevas empresas y visualizar en forma de lista todas las empresas existentes. Cada empresa opera de forma independiente con sus propios usuarios, sucursales, productos y categorías. |
| Entrada | Formulario de registro de empresa (nombre, RFC o identificador fiscal, datos de contacto). |
| Salida | Empresa registrada y visible en el listado general de empresas. |
| Prioridad | Alta |

---

### REQUERIMIENTOS FUNCIONALES PARA ADMINISTRADOR DE EMPRESA

---

### RF3: Gestión de sucursales

El código de requerimiento RF3 se refiere a la funcionalidad de administrar las sucursales pertenecientes a una empresa.

**Tabla 3.3 Descripción RF3**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RF3 |
| Nombre | Gestión de sucursales |
| Propósito | Crear, visualizar y activar/desactivar sucursales de la empresa. |
| Descripción | El Administrador podrá registrar nuevas sucursales, visualizarlas en forma de lista y cambiar su estado (activa/inactiva). El registro permanece en base de datos; la desactivación es lógica. Cada sucursal mantiene su propio stock independiente de las demás. |
| Entrada | Formulario de sucursal (nombre, dirección, estado activo/inactivo). |
| Salida | Sucursal registrada o actualizada, listado de sucursales de la empresa. |
| Prioridad | Alta |

---

### RF4: Gestión de usuarios

El código de requerimiento RF4 se refiere a la funcionalidad de administrar los usuarios pertenecientes a una empresa dentro de la plataforma.

**Tabla 3.4 Descripción RF4**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RF4 |
| Nombre | Gestión de usuarios |
| Propósito | Crear, visualizar y activar/desactivar usuarios de la empresa. |
| Descripción | El Administrador podrá registrar nuevos usuarios asignándoles un rol (Administrador o estándar), visualizarlos en forma de lista y desactivarlos en caso necesario. La desactivación es lógica; el registro permanece en base de datos y el usuario no podrá iniciar sesión mientras esté inactivo. |
| Entrada | Formulario de usuario (nombre, correo, contraseña, rol, estado activo/inactivo). |
| Salida | Usuario registrado, actualizado o desactivado. Listado de usuarios de la empresa. |
| Prioridad | Alta |

---

### RF5: Gestión de categorías

El código de requerimiento RF5 se refiere a la funcionalidad de administrar las categorías de productos definidas por la empresa.

**Tabla 3.5 Descripción RF5**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RF5 |
| Nombre | Gestión de categorías |
| Propósito | Crear, visualizar y activar/desactivar categorías de productos propias de la empresa. |
| Descripción | El Administrador podrá registrar nuevas categorías con nombre (2–50 caracteres, sin caracteres especiales) y descripción opcional (máx. 200 caracteres), visualizarlas en forma de lista y cambiar su estado (activa/inactiva). Las categorías están limitadas a la empresa y se utilizan para clasificar los productos del catálogo. |
| Entrada | Formulario de categoría (nombre, descripción). |
| Salida | Categoría registrada o actualizada. Listado de categorías activas de la empresa. |
| Prioridad | Alta |

---

### RF6: Gestión de productos

El código de requerimiento RF6 se refiere a la funcionalidad de administrar el catálogo de productos de la empresa.

**Tabla 3.6 Descripción RF6**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RF6 |
| Nombre | Gestión de productos |
| Propósito | Crear, visualizar, editar y activar/desactivar productos del catálogo de la empresa. |
| Descripción | El Administrador podrá registrar nuevos productos asignándoles SKU único, nombre, precio, categoría (seleccionada del catálogo de categorías de la empresa) y configuración de control de inventario (stock mínimo/máximo opcionales). También podrá editar la información de productos existentes y activar/desactivar productos. Los productos se crean localmente de forma inmediata y se sincronizan con el servidor cuando hay conexión disponible. |
| Entrada | Formulario de producto (nombre, SKU, precio, categoría, estado activo/inactivo, control de inventario y stock mínimo/máximo opcionales). |
| Salida | Producto registrado o actualizado en catálogo local y servidor. Listado de productos con filtros por nombre, SKU y categoría, con paginación de 20 registros por página. |
| Prioridad | Alta |

---

### RF7: Registro de movimientos de inventario

El código de requerimiento RF7 se refiere a la funcionalidad de registrar entradas y salidas de stock por sucursal.

**Tabla 3.7 Descripción RF7**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RF7 |
| Nombre | Registro de movimientos de inventario |
| Propósito | Registrar entradas y salidas de stock de un producto en una sucursal específica. |
| Descripción | El usuario podrá registrar movimientos de inventario indicando el producto, la sucursal, el tipo de movimiento (entrada o salida), la cantidad y una nota opcional. El sistema calcula automáticamente el stock anterior y el stock resultante. El movimiento queda guardado localmente de forma inmediata y se sincroniza con el servidor cuando hay conexión disponible. |
| Entrada | Formulario de movimiento (producto, sucursal, tipo [entrada/salida], cantidad, nota opcional). |
| Salida | Movimiento registrado. Stock actualizado en la sucursal correspondiente. |
| Prioridad | Alta |

---

### RF8: Consulta de movimientos de inventario

El código de requerimiento RF8 se refiere a la funcionalidad de visualizar el historial de movimientos de inventario con filtros y paginación.

**Tabla 3.8 Descripción RF8**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RF8 |
| Nombre | Consulta de movimientos de inventario |
| Propósito | Visualizar el historial de movimientos de inventario filtrado por sucursal, con paginación desde el servidor. |
| Descripción | El usuario podrá consultar el historial completo de movimientos ordenados por fecha descendente. Los resultados se obtienen paginados desde el servidor (20 registros por página) para evitar la saturación de datos. El usuario puede navegar entre páginas mediante controles Anterior/Siguiente. |
| Entrada | Filtro opcional por sucursal. Número de página (Anterior/Siguiente). |
| Salida | Lista paginada de movimientos con fecha, producto, sucursal, tipo, cantidad, stock anterior y stock resultante. Indicador de página actual y total de páginas. |
| Prioridad | Alta |

---

### RF9: Consulta de detalle de producto por sucursal

El código de requerimiento RF9 se refiere a la funcionalidad de visualizar el detalle de stock y movimientos de un producto en cada sucursal mediante gráficas.

**Tabla 3.9 Descripción RF9**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RF9 |
| Nombre | Consulta de detalle de producto por sucursal |
| Propósito | Visualizar el stock y el historial de movimientos de un producto específico desglosado por sucursal, con representación gráfica. |
| Descripción | Al seleccionar un producto del catálogo, el usuario podrá ver una pantalla de detalle que muestra el stock actual de ese producto en cada sucursal mediante gráfica de barras, y el historial de movimientos de ese producto por sucursal mediante gráfica de línea. |
| Entrada | Identificador de producto (localId). |
| Salida | Pantalla de detalle con gráfica de stock por sucursal y gráfica de movimientos históricos por sucursal. |
| Prioridad | Media |

---

### RF10: Sincronización offline-first con el servidor

El código de requerimiento RF10 se refiere a la funcionalidad de sincronización automática de datos entre el dispositivo móvil y el servidor en la nube.

**Tabla 3.10 Descripción RF10**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RF10 |
| Nombre | Sincronización offline-first con el servidor |
| Propósito | Garantizar que las operaciones realizadas sin conexión a internet se sincronicen automáticamente con el servidor cuando la conectividad esté disponible. |
| Descripción | Todas las operaciones de creación de productos y movimientos de inventario se guardan primero en la base de datos local SQLite del dispositivo y se agregan a una cola de sincronización. Cuando el dispositivo detecta conexión, el sistema procesa la cola de forma automática, enviando los registros pendientes al servidor. En caso de fallo, el sistema reintenta hasta 5 veces antes de marcar el elemento como fallido. |
| Entrada | Cola de sincronización pendiente (operaciones CREATE almacenadas localmente). |
| Salida | Registros confirmados en el servidor. Cola de sincronización procesada. |
| Prioridad | Alta |

---

## 3.2 Requerimientos no funcionales

---

### RNF1: Operación sin conexión a internet (Offline-First)

**Tabla 3.11 Descripción RNF1**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RNF1 |
| Nombre | Operación offline |
| Descripción | La aplicación debe funcionar completamente sin conexión a internet para las operaciones de consulta de productos, consulta de sucursales y registro de movimientos de inventario. Los datos se almacenan localmente en SQLite y se sincronizan con el servidor cuando hay conexión disponible. |
| Prioridad | Alta |

---

### RNF2: Seguridad y control de acceso por roles

**Tabla 3.12 Descripción RNF2**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RNF2 |
| Nombre | Seguridad y roles |
| Descripción | Toda comunicación con el servidor debe realizarse mediante HTTPS con autenticación JWT. El sistema distingue tres roles: SuperAdministrador (gestión global de empresas), Administrador de empresa (gestión de su empresa) y usuario estándar. Cada endpoint del servidor valida el token y el rol antes de procesar la solicitud. Las funciones de administración (categorías, usuarios) son visibles únicamente para el rol correspondiente. |
| Prioridad | Alta |

---

### RNF3: Rendimiento y paginación

**Tabla 3.13 Descripción RNF3**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RNF3 |
| Nombre | Rendimiento y paginación |
| Descripción | El historial de movimientos de inventario se consulta paginado desde el servidor (20 registros por página) para evitar la transferencia masiva de datos y saturación de memoria. El catálogo de productos se pagina del lado del cliente (20 productos por página sobre el total local). Los filtros de búsqueda se aplican antes de paginar para mantener la consistencia. |
| Prioridad | Alta |

---

### RNF4: Usabilidad y diseño responsivo

**Tabla 3.14 Descripción RNF4**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RNF4 |
| Nombre | Usabilidad y diseño responsivo |
| Descripción | La interfaz debe adaptarse a distintos tamaños de pantalla (teléfonos y tabletas) ajustando el ancho máximo del contenido, el espaciado horizontal y la distribución de elementos. La aplicación debe soportar modo claro y modo oscuro de forma automática según la configuración del sistema operativo del dispositivo. |
| Prioridad | Media |

---

### RNF5: Portabilidad multiplataforma

**Tabla 3.15 Descripción RNF5**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RNF5 |
| Nombre | Portabilidad multiplataforma |
| Descripción | La aplicación debe ejecutarse en dispositivos Android e iOS sin modificaciones al código fuente, utilizando React Native con Expo como framework de desarrollo multiplataforma. |
| Prioridad | Media |

---

### RNF6: Disponibilidad del servidor

**Tabla 3.16 Descripción RNF6**

| Campo | Descripción |
|---|---|
| Código de requerimiento | RNF6 |
| Nombre | Disponibilidad del servidor |
| Descripción | El servidor backend debe mantener una disponibilidad mínima del 95% mensual. Dado que la aplicación opera en modo offline-first, las interrupciones del servidor no impiden el uso de la aplicación; únicamente afectan la sincronización de datos hasta que la conectividad se restaura. |
| Prioridad | Media |
