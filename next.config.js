/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Railway deployment
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Add experimental configurations to handle server components better
  experimental: {
    // External packages that should be bundled with server components
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'jsonwebtoken'],
  },
  // Configure image optimization
  images: {
    domains: ['localhost', 'pims-production.up.railway.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Increase timeout for builds
  staticPageGenerationTimeout: 120,
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
  // Optimize compiled code
  swcMinify: true,
};

module.exports = nextConfig; 