/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ Warnung: TypeScript-Fehler werden im Build ignoriert
    ignoreBuildErrors: true,
  },
  eslint: {
    // Optionally also ignore ESLint errors
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 