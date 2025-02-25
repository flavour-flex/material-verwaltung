/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Webpack-Konfiguration für bessere HMR-Stabilität
    if (!isServer) {
      config.optimization.runtimeChunk = 'single';
    }
    return config;
  },
}

module.exports = nextConfig 