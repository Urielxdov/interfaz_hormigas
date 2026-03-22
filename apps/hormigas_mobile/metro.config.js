const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

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
  '@hormigas/core': path.resolve(workspaceRoot, 'packages/core'),
  'react-native-css-interop': path.resolve(projectRoot, 'node_modules/react-native-css-interop'),
  'react-native-css-interop/jsx-runtime': path.resolve(projectRoot, 'node_modules/react-native-css-interop/jsx-runtime'), // ✅
}

// Bloqueamos el acceso a la otra aplicacion de app
config.resolver.blockList = [
  new RegExp(
    `${path.resolve(workspaceRoot, 'apps', 'hormigas_web', 'node_modules').replace(/\\/g, '\\\\')}.*`
  ),
]

module.exports = withNativeWind(config, { input: "./global.css" })