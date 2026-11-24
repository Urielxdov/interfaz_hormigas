# 🐜 Hormigas

**Sistema de inventario y punto de venta para pequeñas y medianas empresas.**  
Gestiona productos, sucursales y ventas desde el celular — con o sin conexión a internet.

---

## ¿Qué es Hormigas?

Hormigas es una aplicación móvil para negocios con múltiples sucursales. Permite a los administradores controlar su inventario en tiempo real y a los cajeros registrar ventas aunque no haya señal. Cuando regresa la conexión, todo se sincroniza automáticamente.

---

## Una sola app, vistas por rol

`hormigas_mobile` es la única app móvil. Después del login, cada usuario ve lo que le corresponde según el claim `roles` del JWT:

| Rol | Para quién | Qué ve |
|-----|-----------|--------|
| `ROLE_USER` | Cajeros | Punto de venta: registrar ventas, calcular cambio, historial con estado de sync |
| `ROLE_ADMIN` | Administradores | Productos, sucursales, inventario, movimientos y usuarios, más acceso al punto de venta (pestaña del carrito) |
| `ROLE_SUPER_ADMIN` | Super administradores | Panel de empresas |

---

## Características principales

- **Offline-first** — funciona sin internet; sincroniza en segundo plano al reconectar
- **Multi-sucursal** — cada sucursal tiene su propio inventario y stock
- **Control de stock** — alertas de stock bajo, movimientos de entrada y salida, validación de cantidades
- **Punto de venta** — carrito multi-producto, búsqueda en tiempo real, cálculo automático de cambio
- **Roles de acceso** — Cajero (POS), Administrador (gestión), Super Admin (gestión de empresas)
- **Categorías de productos** — organiza tu catálogo con etiquetas personalizadas
- **Prevención de duplicados** — detecta productos y sucursales duplicados antes de crear; ofrece reactivar registros inactivos
- **Sincronización visible** — badge en el header muestra el estado de sync en tiempo real

---

## Capturas de pantalla

> *(próximamente)*

---

## Requisitos

- Dispositivo Android 8.0+ o iOS 14+
- Servidor Hormigas API corriendo en la red local o en la nube

Para desarrollo local:

- Node.js 20+
- pnpm 8+
- Android Studio (Android) o Xcode (iOS)

---

## Instalación rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/Urielxdov/interfaz_hormigas.git
cd interfaz_hormigas

# 2. Instalar dependencias
pnpm install

# 3. Configurar la URL de la API
echo "EXPO_PUBLIC_API_URL=http://<ip-del-servidor>:8080" > apps/mobile/hormigas_mobile/.env

# 4. Iniciar la app (gestión + punto de venta)
cd apps/mobile/hormigas_mobile
pnpm start
```

Luego escanea el QR con la app **Expo Go** o conecta un dispositivo/emulador.

---

## Estructura del repositorio

```
interfaz_hormigas/
├── apps/
│   └── mobile/
│       ├── hormigas_mobile/   # App única: POS (Cajero), gestión (Admin) y empresas (Super Admin)
│       └── shared/            # Contextos y factories compartidos
└── packages/
    ├── domain/                # Entidades y esquema SQLite
    ├── application/           # Servicios y casos de uso
    └── infrastructure/        # SQLite, HTTP, mappers
```

---

## Documentación técnica

Para arquitectura, esquema de base de datos, flujo offline-first, build con EAS y guías de contribución:

👉 [`docs/TECHNICAL.md`](docs/TECHNICAL.md)

---

## Licencia

Propietario — Edgar Uriel Hernandez Galvan
