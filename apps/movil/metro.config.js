// Metro debe poder resolver `@invenlux/core` fuera de apps/movil (monorepo).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const raizProyecto = __dirname;
const raizMonorepo = path.resolve(raizProyecto, '../..');

const config = getDefaultConfig(raizProyecto);
config.watchFolders = [raizMonorepo];
config.resolver.nodeModulesPaths = [
  path.resolve(raizProyecto, 'node_modules'),
  path.resolve(raizMonorepo, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
