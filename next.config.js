/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
    // This allows production builds to complete even if ESLint errors exist
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  // Required for Docker / DronaHQ self-host (standalone server.js)
  output: "standalone",
  async headers() {
    return [
      {
        // Allow embedding inside DronaHQ portals via iframe.
        // Tighten Content-Security-Policy frame-ancestors in production
        // to your DronaHQ domain, e.g. "frame-ancestors https://*.dronahq.com".
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Proxy Ollama API calls to external server
      {
        source: '/api/ollama/:path*',
        destination: `${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      // Optional: redirect any direct Ollama calls
      {
        source: '/ollama/:path*',
        destination: `${process.env.OLLAMA_URL || 'http://localhost:11434'}/:path*`,
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig

