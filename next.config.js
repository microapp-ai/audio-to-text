/** @type {import('next').NextConfig} */
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'microapp-boilerplate',
        exposes: {
          './Home': './pages/index',
        },
        filename: 'static/chunks/remoteEntry.js',
        extraOptions: {
          enableImageLoaderFix: true,
          enableUrlLoaderFix: true,
          skipSharingNextInternals: false,
          automaticPageStitching: false,
        },
      })
    );

    return config;
  },
};

module.exports = nextConfig;
