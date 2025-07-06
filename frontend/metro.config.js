const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web-specific resolver configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add web-specific asset extensions and handle image processing
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'bin',
  'txt',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'tiff',
  'svg'
];

// Configure web-specific transformations
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config; 