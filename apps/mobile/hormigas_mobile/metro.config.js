const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../../..")

const config = getDefaultConfig(projectRoot)

// Aqui le decimos donde buscar fuera del proyecto
config.watchFolders = [workspaceRoot]

// Devuelve modulos primero en el proyecto, luego en el mono repo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]

// Alias para paquetes del monorepo (evita duplicados de react)
config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  '@hormigas/application': path.resolve(workspaceRoot, 'packages/application'),
  '@hormigas/domain': path.resolve(workspaceRoot, 'packages/domain'),
  '@hormigas/mobile-shared': path.resolve(workspaceRoot, 'apps/mobile/shared'),
  '@hormigas/infrastructure': path.resolve(workspaceRoot, 'packages/infrastructure'),
  'react-native-css-interop': path.resolve(projectRoot, 'node_modules/react-native-css-interop'),
  'react-native-css-interop/jsx-runtime': path.resolve(projectRoot, 'node_modules/react-native-css-interop/jsx-runtime'),
}

// Bloqueamos el acceso a la otra aplicacion de app
config.resolver.blockList = [
  new RegExp(
    `${path.resolve(workspaceRoot, 'apps', 'desktop', 'hormigas_desktop', 'node_modules').replace(/\\/g, '\\\\')}.*`
  ),
  new RegExp(
    `${path.resolve(workspaceRoot, 'apps', 'mobile', 'hormigas_POS', 'node_modules').replace(/\\/g, '\\\\')}.*`
  ),
]
module.exports = withNativeWind(config, { input: "./global.css" })