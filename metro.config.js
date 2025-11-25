// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
    transformer: {
        assetPlugins: ['expo-asset/tools/hashAssetFiles'],
    },

    resolver: {
        assetExts: [
            ...defaultConfig.resolver.assetExts,
            'png',
            'jpg',
            'jpeg',
            'webp'
        ],
    },
};

module.exports = mergeConfig(defaultConfig, config);
