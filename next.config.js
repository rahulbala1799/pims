/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // Force Server Components to be treated as Client Components during static generation
    appDir: true,
    // Disable static generation for API routes, improving auth compatibility
    serverActions: {
      bodySizeLimit: '2mb',
    },
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
  // Configure compiler to handle JSON Web Tokens properly
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  webpack: (config, { isServer }) => {
    // Add jsonwebtoken polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      };
    }
    return config;
  },
};

module.exports = nextConfig; 