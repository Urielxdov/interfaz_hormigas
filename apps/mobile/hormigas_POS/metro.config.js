const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../../..")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]

config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  '@hormigas/application': path.resolve(workspaceRoot, 'packages/application'),
  '@hormigas/domain': path.resolve(workspaceRoot, 'packages/domain'),
  '@hormigas/infrastructure': path.resolve(workspaceRoot, 'packages/infrastructure'),
  'react-native-css-interop': path.resolve(projectRoot, 'node_modules/react-native-css-interop'),
  'react-native-css-interop/jsx-runtime': path.resolve(projectRoot, 'node_modules/react-native-css-interop/jsx-runtime'),
}

config.resolver.blockList = [
  new RegExp(
    `${path.resolve(workspaceRoot, 'apps', 'mobile', 'hormigas_mobile', 'node_modules').replace(/\\/g, '\\\\')}.*`
  ),
]

module.exports = withNativeWind(config, { input: "./global.css" })
