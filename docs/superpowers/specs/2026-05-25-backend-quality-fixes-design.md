# Backend Quality Fixes — Design

**Fecha:** 2026-05-25  
**Estado:** Aprobado

## Objetivo

Corregir 3 deudas técnicas identificadas en la revisión estructural del backend Spring Boot:
1. Inputs sin validar en controllers
2. Sin manejo global de excepciones
3. Lógica de inventario duplicada en `MovimientoService`

---

## Fix 1: Validación de DTOs con `@Valid`

### Dependencia

Agregar a `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

### Anotaciones en DTOs de request

| DTO | Campo | Anotación |
|-----|-------|-----------|
| `CrearMovimientoDTO` | `sucursalId`, `productoId` | `@NotNull` |
| `CrearMovimientoDTO` | `tipoMovimiento` | `@NotNull` |
| `CrearMovimientoDTO` | `cantidad` | `@Positive` |
| `VentaBatchDTO` | `sucursalId` | `@NotNull` |
| `VentaBatchDTO` | `items` | `@NotEmpty` |
| `VentaBatchItemDTO` | `productoId` | `@NotNull` |
| `VentaBatchItemDTO` | `cantidad` | `@Positive` |
| `CrearInventarioDTO` | `sucursalId`, `productoId` | `@NotNull` |
| `CrearInventarioDTO` | `stockMinimo`, `stockMaximo` | `@PositiveOrZero` |
| `NuevoProductoDTO` | `nombre`, `sku`, `categoria` | `@NotBlank` |
| `NuevoProductoDTO` | `precio` | `@PositiveOrZero` |
| `SucursalCreateDTO` | `nombre` | `@NotBlank` |
| `EmpresaCreateDTO` / `EmpresaConAdminCreateDTO` | `nombre` | `@NotBlank` |
| `LoginRequestDTO` | `correo`, `password` | `@NotBlank` |
| `CreateUsuarioDTO` | `nombre`, `correo`, `password` | `@NotBlank` |

### En controllers

Agregar `@Valid` antes de cada `@RequestBody`:
```java
public ResponseDTO crear(@Valid @RequestBody CrearDTO dto)
```

Aplica a: `MovimientoController`, `InventarioController`, `ProductoController`, `SucursalController`, `EmpresaController`, `AuthController`, `UsuarioController`.

---

## Fix 2: GlobalExceptionHandler

### Ubicación

`com.example.hormigas.shared.exception.GlobalExceptionHandler`

### Respuesta estándar

```java
record ErrorResponse(String error, int status) {}
```

### Mapeo de excepciones

| Excepción | HTTP Status | Mensaje |
|-----------|-------------|---------|
| `EntityNotFoundException` | 404 | mensaje de la excepción |
| `IllegalArgumentException` | 400 | mensaje de la excepción |
| `EmpresaDuplicadaException` | 409 | mensaje de la excepción |
| `MethodArgumentNotValidException` | 400 | lista de campos inválidos: `"campo: mensaje"` |
| `Exception` (genérica) | 500 | "Error interno del servidor" |

### Estructura del handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(EntityNotFoundException ex) { ... }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleBadRequest(IllegalArgumentException ex) { ... }

    @ExceptionHandler(EmpresaDuplicadaException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleConflict(EmpresaDuplicadaException ex) { ... }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) { ... }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex) { ... }
}
```

---

## Fix 3: Extraer lógica duplicada en MovimientoService

### Método privado a extraer

```java
private Movimiento procesarItemMovimiento(
    Long sucursalId,
    Long productoId,
    TipoMovimiento tipo,
    int cantidad,
    String referencia,
    Usuario user
)
```

**Contiene:**
1. Buscar inventario: `inventarioRepository.findBySucursalIdAndProductoId(...)`
2. Calcular nuevo stock: `tipo.aplicar(stockActual, cantidad)`
3. Validar: `if (nuevoStock < 0) throw new IllegalArgumentException(...)`
4. Actualizar inventario: `inventario.setStockActual(nuevoStock); inventarioRepository.save(...)`
5. Construir `Movimiento` con todos los campos
6. Guardar y retornar el `Movimiento`

### Refactor de métodos públicos

**`registrarMovimiento`**: Mantiene la búsqueda/validación de sucursal, luego llama `procesarItemMovimiento(sucursalId, dto.productoId(), dto.tipoMovimiento(), dto.cantidad(), dto.referencia(), user)`.

**`registrarVentaBatch`**: Mantiene la búsqueda/validación de sucursal y el loop, luego llama `procesarItemMovimiento(sucursalId, item.productoId(), TipoMovimiento.VENTA, item.cantidad(), dto.referencia(), user)` por cada item.

---

## Lo que NO cambia

- Lógica de negocio en services
- Estructura de paquetes
- Mappers, entidades, repositorios
- Configuración de seguridad (JWT, roles)
