// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude web platform - Driven is mobile-only (Android/iOS)
config.resolver.platforms = ['ios', 'android'];

// Ensure cjs modules are resolved (needed for some libraries like paths-js)
config.resolver.sourceExts.push('cjs');

module.exports = config;
