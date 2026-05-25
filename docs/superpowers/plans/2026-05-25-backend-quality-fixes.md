# Backend Quality Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 3 backend technical debts in the Spring Boot API: DTO validation, global exception handling, and duplicate inventory logic extraction.

**Architecture:** Jakarta Bean Validation annotations on all request DTOs + `@Valid` in controllers trigger 400 automatically; `@RestControllerAdvice` centralises all error mapping; private `procesarItemMovimiento()` in `MovimientoService` eliminates ~25 lines of duplicated inventory/movement logic.

**Tech Stack:** Spring Boot 3.2.5, Java 21, Jakarta Bean Validation (`spring-boot-starter-validation`), `@RestControllerAdvice`

---

### Task 1: Add validation dependency

**Files:**
- Modify: `hormigas/pom.xml`

- [ ] **Step 1: Add the dependency**

In `/home/uhernand/hormigas/pom.xml`, inside `<dependencies>`, add:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

- [ ] **Step 2: Verify compilation**

```bash
cd /home/uhernand/hormigas && mvn compile -q
```
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/hormigas
git add pom.xml
git commit -m "build: add spring-boot-starter-validation dependency"
```

---

### Task 2: Annotate request DTOs

**Files:**
- Modify: `hormigas/src/main/java/com/example/hormigas/movimiento/dto/CrearMovimientoDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/movimiento/dto/VentaBatchDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/movimiento/dto/VentaBatchItemDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/inventario/dto/CrearInventarioDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/producto/dto/NuevoProductoDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/sucursal/dto/SucursalCreateDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/empresa/dto/EmpresaCreateDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/empresa/dto/EmpresaConAdminCreateDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/security/infrastructure/dtos/LoginRequestDTO.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/security/infrastructure/dtos/CreateUsuarioDTO.java`

- [ ] **Step 1: Annotate CrearMovimientoDTO**

```java
package com.example.hormigas.movimiento.dto;

import com.example.hormigas.movimiento.entity.TipoMovimiento;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CrearMovimientoDTO(
        @NotNull Long sucursalId,
        @NotNull Long productoId,
        @NotNull TipoMovimiento tipoMovimiento,
        @Positive int cantidad,
        String referencia
) {}
```

- [ ] **Step 2: Annotate VentaBatchDTO**

Note: `@Valid` on the list triggers cascade validation into each `VentaBatchItemDTO`.
```java
package com.example.hormigas.movimiento.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record VentaBatchDTO(
        @NotNull Long sucursalId,
        @NotEmpty @Valid List<VentaBatchItemDTO> items,
        String referencia
) {}
```

- [ ] **Step 3: Annotate VentaBatchItemDTO**

```java
package com.example.hormigas.movimiento.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record VentaBatchItemDTO(
        @NotNull Long productoId,
        @Positive int cantidad
) {}
```

- [ ] **Step 4: Annotate CrearInventarioDTO**

```java
package com.example.hormigas.inventario.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record CrearInventarioDTO(
        @NotNull Long sucursalId,
        @NotNull Long productoId,
        int stockActual,
        @PositiveOrZero Integer stockMinimo,
        @PositiveOrZero int stockMaximo
) {}
```

- [ ] **Step 5: Annotate NuevoProductoDTO**

```java
package com.example.hormigas.producto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record NuevoProductoDTO(
        @NotBlank String nombre,
        String descripcion,
        @NotBlank String sku,
        @PositiveOrZero BigDecimal precio
) {}
```

- [ ] **Step 6: Annotate SucursalCreateDTO**

```java
package com.example.hormigas.sucursal.dto;

import jakarta.validation.constraints.NotBlank;

public record SucursalCreateDTO(
        @NotBlank String nombre,
        String direccion,
        Long encargadoId
) {}
```

- [ ] **Step 7: Annotate EmpresaCreateDTO**

```java
package com.example.hormigas.empresa.dto;

import jakarta.validation.constraints.NotBlank;

public record EmpresaCreateDTO(
        @NotBlank String nombre,
        String rfc,
        String direccion,
        String telefono
) {}
```

- [ ] **Step 8: Annotate EmpresaConAdminCreateDTO**

`@Valid` on `empresa` cascades validation into `EmpresaCreateDTO.nombre`.
```java
package com.example.hormigas.empresa.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record EmpresaConAdminCreateDTO(
        @NotNull @Valid EmpresaCreateDTO empresa,
        @NotNull UsuarioEmpresaCreateDTO admin
) {}
```

- [ ] **Step 9: Annotate LoginRequestDTO**

Note: the field is `email`, not `correo`.
```java
package com.example.hormigas.security.infrastructure.dtos;

import jakarta.validation.constraints.NotBlank;

public record LoginRequestDTO(
        @NotBlank String email,
        @NotBlank String password
) {}
```

- [ ] **Step 10: Annotate CreateUsuarioDTO**

```java
package com.example.hormigas.security.infrastructure.dtos;

import jakarta.validation.constraints.NotBlank;

public record CreateUsuarioDTO(
        @NotBlank String correo,
        @NotBlank String password,
        @NotBlank String nombre,
        Long empresaId,
        Long sucursalId
) {}
```

- [ ] **Step 11: Verify compilation**

```bash
cd /home/uhernand/hormigas && mvn compile -q
```
Expected: `BUILD SUCCESS`

- [ ] **Step 12: Commit**

```bash
cd /home/uhernand/hormigas
git add \
  src/main/java/com/example/hormigas/movimiento/dto/CrearMovimientoDTO.java \
  src/main/java/com/example/hormigas/movimiento/dto/VentaBatchDTO.java \
  src/main/java/com/example/hormigas/movimiento/dto/VentaBatchItemDTO.java \
  src/main/java/com/example/hormigas/inventario/dto/CrearInventarioDTO.java \
  src/main/java/com/example/hormigas/producto/dto/NuevoProductoDTO.java \
  src/main/java/com/example/hormigas/sucursal/dto/SucursalCreateDTO.java \
  src/main/java/com/example/hormigas/empresa/dto/EmpresaCreateDTO.java \
  src/main/java/com/example/hormigas/empresa/dto/EmpresaConAdminCreateDTO.java \
  src/main/java/com/example/hormigas/security/infrastructure/dtos/LoginRequestDTO.java \
  src/main/java/com/example/hormigas/security/infrastructure/dtos/CreateUsuarioDTO.java
git commit -m "feat(validation): add bean validation constraints to all request DTOs"
```

---

### Task 3: Add @Valid to controllers

**Files:**
- Modify: `hormigas/src/main/java/com/example/hormigas/movimiento/controller/MovimientoController.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/inventario/controller/InventarioController.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/producto/controller/ProductoController.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/sucursal/controller/SucursalController.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/empresa/controller/EmpresaController.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/security/infrastructure/controller/AuthController.java`
- Modify: `hormigas/src/main/java/com/example/hormigas/security/infrastructure/controller/UsuarioController.java`

- [ ] **Step 1: Update MovimientoController**

```java
package com.example.hormigas.movimiento.controller;

import com.example.hormigas.movimiento.dto.CrearMovimientoDTO;
import com.example.hormigas.movimiento.dto.MovimientoFiltroDTO;
import com.example.hormigas.movimiento.dto.MovimientoResponseDTO;
import com.example.hormigas.movimiento.dto.VentaBatchDTO;
import com.example.hormigas.movimiento.entity.TipoMovimiento;
import com.example.hormigas.movimiento.service.MovimientoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movimiento")
public class MovimientoController {
    private final MovimientoService movimientoService;

    public MovimientoController(MovimientoService movimientoService) {
        this.movimientoService = movimientoService;
    }

    @PostMapping("/crear")
    public MovimientoResponseDTO createMovimiento(@Valid @RequestBody CrearMovimientoDTO dto) {
        return movimientoService.registrarMovimiento(dto);
    }

    @PostMapping("/venta/batch")
    public List<MovimientoResponseDTO> registrarVentaBatch(@Valid @RequestBody VentaBatchDTO dto) {
        return movimientoService.registrarVentaBatch(dto);
    }

    @GetMapping("/buscar")
    public List<MovimientoResponseDTO> obtenerMovimientos(
            @RequestParam(required = false) Long sucursalId,
            @RequestParam(required = false) Long productoId,
            @RequestParam(required = false) Long inventarioId,
            @RequestParam(required = false) TipoMovimiento tipo
    ) {
        MovimientoFiltroDTO filtro = new MovimientoFiltroDTO(sucursalId, productoId, inventarioId, tipo);
        return movimientoService.obtenerMovimientos(filtro);
    }
}
```

- [ ] **Step 2: Update InventarioController**

```java
package com.example.hormigas.inventario.controller;

import com.example.hormigas.inventario.dto.CrearInventarioDTO;
import com.example.hormigas.inventario.dto.InventarioFiltroDTO;
import com.example.hormigas.inventario.dto.InventarioResponseDTO;
import com.example.hormigas.inventario.service.InventarioService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
public class InventarioController {

    private InventarioService inventarioService;

    public InventarioController(InventarioService inventarioService) {
        this.inventarioService = inventarioService;
    }

    @PostMapping("/crear")
    public InventarioResponseDTO crear(@Valid @RequestBody CrearInventarioDTO dto) {
        return inventarioService.crear(dto);
    }

    @GetMapping("/porSucursal")
    public List<InventarioResponseDTO> porSucursal(@RequestParam(required = false) Long sucursalId) {
        return inventarioService.obtenerInventario(new InventarioFiltroDTO(sucursalId, null));
    }

    @GetMapping("/stockBajo")
    public List<InventarioResponseDTO> stockBajo() {
        return inventarioService.obtenerStockBajo();
    }
}
```

- [ ] **Step 3: Update ProductoController**

```java
package com.example.hormigas.producto.controller;

import com.example.hormigas.producto.dto.NuevoProductoDTO;
import com.example.hormigas.producto.dto.ProductoConStockDTO;
import com.example.hormigas.producto.dto.ProductoResponseDTO;
import com.example.hormigas.producto.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/producto")
public class ProductoController {
    private ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping("/")
    public Page<ProductoResponseDTO> listarProductos(Pageable pageable) {
        return productoService.obtenerProductos(pageable);
    }

    @PostMapping("/nuevo")
    public ProductoResponseDTO crear(@Valid @RequestBody NuevoProductoDTO dto) {
        return productoService.crearProducto(dto);
    }

    @GetMapping("/buscar")
    public List<ProductoConStockDTO> buscarConStock(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam Long sucursalId) {
        return productoService.buscarConStock(q, sucursalId);
    }
}
```

- [ ] **Step 4: Update SucursalController**

```java
package com.example.hormigas.sucursal.controller;

import com.example.hormigas.sucursal.dto.SucursalCreateDTO;
import com.example.hormigas.sucursal.dto.SucursalResponseDTO;
import com.example.hormigas.sucursal.service.SucursalService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/api/sucursal")
public class SucursalController {

    private final SucursalService sucursalService;

    public SucursalController(SucursalService sucursalService) {
        this.sucursalService = sucursalService;
    }

    @PostMapping("/crear")
    public SucursalResponseDTO crear(@Valid @RequestBody SucursalCreateDTO dto) throws AccessDeniedException {
        return sucursalService.crear(dto);
    }

    @GetMapping("/listar")
    public List<SucursalResponseDTO> listar() {
        return sucursalService.obtenerSucursales();
    }
}
```

- [ ] **Step 5: Update EmpresaController**

Add `@Valid` to `crear`. Remove the local `@ExceptionHandler(EmpresaDuplicadaException.class)` — it will be superseded by `GlobalExceptionHandler` in Task 4.

```java
package com.example.hormigas.empresa.controller;

import com.example.hormigas.empresa.dto.EmpresaConAdminCreateDTO;
import com.example.hormigas.empresa.dto.EmpresaResponseDTO;
import com.example.hormigas.empresa.dto.EmpresaUpdateDTO;
import com.example.hormigas.empresa.service.EmpresaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empresa")
public class EmpresaController {
    private final EmpresaService empresaService;

    public EmpresaController(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    @PostMapping("/create")
    public ResponseEntity<EmpresaResponseDTO> crear(@Valid @RequestBody EmpresaConAdminCreateDTO dto) {
        EmpresaResponseDTO empresa = empresaService.createEmpresa(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(empresa);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        empresaService.deleteEmpresa(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Void> eliminar() {
        empresaService.deleteEmpresa();
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activar(@PathVariable Long id) {
        empresaService.activate(id);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @PatchMapping("/{rfc}/activate")
    public ResponseEntity<EmpresaResponseDTO> activar(@PathVariable String rfc) {
        empresaService.activate(rfc);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @GetMapping("/")
    public ResponseEntity<EmpresaResponseDTO> obtener() {
        return ResponseEntity.ok(empresaService.getEmpresaDetails());
    }

    @PatchMapping("/update")
    public ResponseEntity<EmpresaResponseDTO> actualizarEmpresa(@RequestBody EmpresaUpdateDTO dto) {
        return ResponseEntity.ok(empresaService.updateEmpresa(dto));
    }

    @GetMapping("/all")
    public ResponseEntity<List<EmpresaResponseDTO>> obtenerTodo() {
        return ResponseEntity.ok(empresaService.getAllEmpresas());
    }
}
```

- [ ] **Step 6: Update AuthController**

```java
package com.example.hormigas.security.infrastructure.controller;

import com.example.hormigas.security.application.AuthCookieConstants;
import com.example.hormigas.security.infrastructure.dtos.CreateUsuarioDTO;
import com.example.hormigas.security.infrastructure.dtos.LoginRequestDTO;
import com.example.hormigas.security.domain.services.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping
    public void createUser(@Valid @RequestBody CreateUsuarioDTO createUsuarioDTO) {
        authService.createUser(createUsuarioDTO);
    }

    @PostMapping("/logout")
    public void logout(HttpServletResponse response) {
        final Cookie cookie = new Cookie(AuthCookieConstants.TOKEN_COOKIE_NAME, "");
        cookie.setMaxAge(0);
    }

    @PostMapping("/login")
    public Map<String, String> login(@Valid @RequestBody LoginRequestDTO loginRequestDTO, HttpServletResponse response) {
        final String token = authService.login(loginRequestDTO);
        final Cookie cookie = createAuthCookie(token);
        response.addCookie(cookie);
        response.setStatus(HttpServletResponse.SC_OK);
        return Map.of("token", token);
    }

    private Cookie createAuthCookie(String token) {
        final String SAME_SITE_KEY = "SameSite";
        final Cookie cookie = new Cookie(AuthCookieConstants.TOKEN_COOKIE_NAME, token);
        cookie.setHttpOnly(AuthCookieConstants.HTTP_ONLY);
        cookie.setSecure(AuthCookieConstants.COOKIE_SECURE);
        cookie.setMaxAge(AuthCookieConstants.COOKIE_MAX_AGE);
        cookie.setAttribute(SAME_SITE_KEY, AuthCookieConstants.SAME_SITE);
        return cookie;
    }
}
```

- [ ] **Step 7: Update UsuarioController**

```java
package com.example.hormigas.security.infrastructure.controller;

import com.example.hormigas.security.infrastructure.dtos.CreateUsuarioDTO;
import com.example.hormigas.security.infrastructure.dtos.UsuarioResponseDTO;
import com.example.hormigas.security.domain.services.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuario")
public class UsuarioController {
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/create")
    public UsuarioResponseDTO crearUsuario(@Valid @RequestBody CreateUsuarioDTO createUsuarioDTO) {
        return usuarioService.nuevoUsuario(createUsuarioDTO);
    }

    @GetMapping("/list")
    public ResponseEntity<List<UsuarioResponseDTO>> obtenerTodos() {
        List<UsuarioResponseDTO> usuarios = usuarioService.getAllUsuarios();
        return ResponseEntity.ok(usuarios);
    }
}
```

- [ ] **Step 8: Verify compilation**

```bash
cd /home/uhernand/hormigas && mvn compile -q
```
Expected: `BUILD SUCCESS`

- [ ] **Step 9: Commit**

```bash
cd /home/uhernand/hormigas
git add \
  src/main/java/com/example/hormigas/movimiento/controller/MovimientoController.java \
  src/main/java/com/example/hormigas/inventario/controller/InventarioController.java \
  src/main/java/com/example/hormigas/producto/controller/ProductoController.java \
  src/main/java/com/example/hormigas/sucursal/controller/SucursalController.java \
  src/main/java/com/example/hormigas/empresa/controller/EmpresaController.java \
  src/main/java/com/example/hormigas/security/infrastructure/controller/AuthController.java \
  src/main/java/com/example/hormigas/security/infrastructure/controller/UsuarioController.java
git commit -m "feat(validation): add @Valid to all controller @RequestBody parameters"
```

---

### Task 4: Create GlobalExceptionHandler

**Files:**
- Create: `hormigas/src/main/java/com/example/hormigas/shared/exception/GlobalExceptionHandler.java`

Note: `EmpresaController`'s local handler was already removed in Task 3 Step 5.

- [ ] **Step 1: Create the handler**

Create `/home/uhernand/hormigas/src/main/java/com/example/hormigas/shared/exception/GlobalExceptionHandler.java`:

```java
package com.example.hormigas.shared.exception;

import com.example.hormigas.empresa.exception.EmpresaDuplicadaException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    record ErrorResponse(String error, int status) {}

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(EntityNotFoundException ex) {
        return new ErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND.value());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleBadRequest(IllegalArgumentException ex) {
        return new ErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
    }

    @ExceptionHandler(EmpresaDuplicadaException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleConflict(EmpresaDuplicadaException ex) {
        return new ErrorResponse(ex.getMessage(), HttpStatus.CONFLICT.value());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        String fields = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getField)
                .collect(Collectors.joining(", "));
        return new ErrorResponse("Campos inválidos: " + fields, HttpStatus.BAD_REQUEST.value());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex) {
        return new ErrorResponse("Error interno del servidor", HttpStatus.INTERNAL_SERVER_ERROR.value());
    }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /home/uhernand/hormigas && mvn compile -q
```
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/hormigas
git add src/main/java/com/example/hormigas/shared/exception/GlobalExceptionHandler.java
git commit -m "feat(exception): add GlobalExceptionHandler with uniform error responses"
```

---

### Task 5: Extract procesarItemMovimiento in MovimientoService

**Files:**
- Modify: `hormigas/src/main/java/com/example/hormigas/movimiento/service/MovimientoService.java`

- [ ] **Step 1: Replace MovimientoService with refactored version**

```java
package com.example.hormigas.movimiento.service;

import com.example.hormigas.inventario.entity.Inventario;
import com.example.hormigas.inventario.repository.InventarioRepository;
import com.example.hormigas.movimiento.dto.CrearMovimientoDTO;
import com.example.hormigas.movimiento.dto.MovimientoFiltroDTO;
import com.example.hormigas.movimiento.dto.MovimientoResponseDTO;
import com.example.hormigas.movimiento.dto.VentaBatchDTO;
import com.example.hormigas.movimiento.dto.VentaBatchItemDTO;
import com.example.hormigas.movimiento.entity.Movimiento;
import com.example.hormigas.movimiento.entity.TipoMovimiento;
import com.example.hormigas.movimiento.mapper.MovimientoMapper;
import com.example.hormigas.movimiento.repository.MovimientoRepository;
import com.example.hormigas.movimiento.repository.MovimientoSpecification;
import com.example.hormigas.producto.repository.ProductoRepository;
import com.example.hormigas.security.domain.Usuario;
import com.example.hormigas.security.domain.services.UsuarioService;
import com.example.hormigas.sucursal.entity.Sucursal;
import com.example.hormigas.sucursal.repository.SucursalRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class MovimientoService {

    private final InventarioRepository inventarioRepository;
    private final MovimientoRepository movimientoRepository;
    private final SucursalRepository sucursalRepository;
    private final UsuarioService usuarioService;
    private final ProductoRepository productoRepository;

    public MovimientoService(
            InventarioRepository inventarioRepository,
            MovimientoRepository movimientoRepository,
            UsuarioService usuarioService,
            SucursalRepository sucursalRepository,
            ProductoRepository productoRepository
    ) {
        this.inventarioRepository = inventarioRepository;
        this.movimientoRepository = movimientoRepository;
        this.usuarioService = usuarioService;
        this.sucursalRepository = sucursalRepository;
        this.productoRepository = productoRepository;
    }

    @Transactional
    public MovimientoResponseDTO registrarMovimiento(CrearMovimientoDTO dto) {
        Usuario user = usuarioService.getUsuarioLogueado();
        Sucursal sucursal = sucursalRepository.findByIdAndEmpresaId(dto.sucursalId(), user.getEmpresa().getId())
                .orElseThrow(() -> new EntityNotFoundException("No se encontro la sucursal"));
        if (!sucursal.isActiva()) throw new IllegalArgumentException("La sucursal no esta activa");

        Movimiento movimiento = procesarItemMovimiento(
                sucursal.getId(), dto.productoId(), dto.tipoMovimiento(), dto.cantidad(), dto.referencia(), user
        );
        return MovimientoMapper.toResponse(movimiento);
    }

    @Transactional
    public List<MovimientoResponseDTO> registrarVentaBatch(VentaBatchDTO dto) {
        Usuario user = usuarioService.getUsuarioLogueado();
        Sucursal sucursal = sucursalRepository.findByIdAndEmpresaId(dto.sucursalId(), user.getEmpresa().getId())
                .orElseThrow(() -> new EntityNotFoundException("No se encontro la sucursal"));
        if (!sucursal.isActiva()) throw new IllegalArgumentException("La sucursal no esta activa");

        List<MovimientoResponseDTO> resultados = new ArrayList<>();
        for (VentaBatchItemDTO item : dto.items()) {
            Movimiento movimiento = procesarItemMovimiento(
                    sucursal.getId(), item.productoId(), TipoMovimiento.VENTA, item.cantidad(), dto.referencia(), user
            );
            resultados.add(MovimientoMapper.toResponse(movimiento));
        }
        return resultados;
    }

    public List<MovimientoResponseDTO> obtenerMovimientos(MovimientoFiltroDTO filtro) {
        Usuario user = usuarioService.getUsuarioLogueado();
        List<Movimiento> movimientos = movimientoRepository.findAll(
                MovimientoSpecification.conFiltros(user.getEmpresa().getId(), filtro)
        );
        return movimientos.stream().map(MovimientoMapper::toResponse).toList();
    }

    private Movimiento procesarItemMovimiento(
            Long sucursalId,
            Long productoId,
            TipoMovimiento tipo,
            int cantidad,
            String referencia,
            Usuario user
    ) {
        Inventario inventario = inventarioRepository
                .findBySucursalIdAndProductoId(sucursalId, productoId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Inventario no encontrado para productoId=" + productoId
                ));

        int stockActual = inventario.getStockActual();
        int nuevoStock = tipo.aplicar(stockActual, cantidad);

        if (nuevoStock < 0) throw new IllegalArgumentException(
                "Stock insuficiente para productoId=" + productoId
        );

        inventario.setStockActual(nuevoStock);
        inventarioRepository.save(inventario);

        Movimiento movimiento = new Movimiento();
        movimiento.setTipoMovimiento(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setStockAnterior(stockActual);
        movimiento.setStockNuevo(nuevoStock);
        movimiento.setUsuario(user);
        movimiento.setInventario(inventario);
        movimiento.setReferencia(referencia);
        movimiento.setFecha(LocalDateTime.now());
        movimientoRepository.save(movimiento);

        return movimiento;
    }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /home/uhernand/hormigas && mvn compile -q
```
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
cd /home/uhernand/hormigas
git add src/main/java/com/example/hormigas/movimiento/service/MovimientoService.java
git commit -m "refactor(movimiento): extract procesarItemMovimiento to eliminate duplicated inventory logic"
```
