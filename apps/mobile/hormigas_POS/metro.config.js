const { getDefaultConfig } = require("expo/metro-config")
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
}

config.resolver.blockList = [
  new RegExp(
    `${path.resolve(workspaceRoot, 'apps', 'mobile', 'hormigas_mobile', 'node_modules').replace(/\\/g, '\\\\')}.*`
  ),
  new RegExp(
    `${path.resolve(workspaceRoot, 'apps', 'desktop').replace(/\\/g, '\\\\')}.*`
  ),
]

module.exports = config
