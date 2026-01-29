// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude web platform - Driven is mobile-only (Android/iOS)
config.resolver.platforms = ['ios', 'android'];

module.exports = config;
