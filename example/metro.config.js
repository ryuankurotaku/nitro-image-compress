const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  watchFolders: [path.resolve(__dirname, '..')],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '..', 'node_modules'),
      path.resolve(__dirname, '..', 'packages', 'react-native-nitro-image-compressor'),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
