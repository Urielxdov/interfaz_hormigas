# 🐜 Instrucciones para Construir hormigas_mobile

## Problema Resuelto

El conflicto de EAS en el monorepo se debía a que faltaba un `eas.json` específico en la carpeta de la app móvil.

## ✅ Cambios Realizados

1. **Creado** `apps/mobile/hormigas_mobile/eas.json` con configuración optimizada para monorepo
2. **Actualizado** `eas.json` raíz para usar `EXPO_USE_WORKSPACES` en la configuración base
3. **Mejorado** prebuildCommand para todos los profiles

## 🚀 Cómo Construir la App

### Opción 1: Desde la carpeta de la app (RECOMENDADO)

```bash
cd apps/mobile/hormigas_mobile
eas build --platform android --profile preview
```

### Opción 2: Desde la raíz con directorio especificado

```bash
# Android
eas build --platform android --profile preview --cwd apps/mobile/hormigas_mobile

# iOS
eas build --platform ios --profile preview --cwd apps/mobile/hormigas_mobile

# Simulador/Emulador local
cd apps/mobile/hormigas_mobile
expo run:android
expo run:ios
```

## 📱 Perfiles Disponibles

- **development**: Cliente de desarrollo con hot reload
- **preview**: Build optimizado para pruebas internas
- **production**: Build final para la tienda

## 🔧 Desarrollo Local

```bash
cd apps/mobile/hormigas_mobile
pnpm install                    # Si es la primera vez
expo start                      # Inicia el servidor de desarrollo
```

Luego en otra terminal:

```bash
expo run:android               # Para Android
expo run:ios                   # Para iOS
expo start --web               # Para web
```

## ⚠️ Si Continúas con Errores

Si aún tienes problemas:

```bash
# Limpia cachés
cd apps/mobile/hormigas_mobile
rm -r node_modules .expo
pnpm install

# Reconstruye desde cero
eas build --platform android --profile preview --clear-cache
```

## 📝 Notas Importantes

- **Metro Config**: Ya está configurado correctamente para resolver módulos del monorepo
- **Node Modules**: Usa los de `apps/mobile/hormigas_mobile/` primero, luego los de la raíz
- **Workspace Packages**: Los alias en `metro.config.js` resuelven automáticamente `@hormigas/*`
