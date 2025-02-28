/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ Warnung: TypeScript-Fehler werden im Build ignoriert
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint-Fehler während des Builds ignorieren
    ignoreDuringBuilds: true,
  },
  // Zusätzliche Optimierungen für Vercel
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig 