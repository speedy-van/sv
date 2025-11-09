/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for large dataset (666+ items)
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    // Allow fallback for problematic packages
    esmExternals: 'loose',
    // Optimize bundle size for large data (666+ items)
    optimizePackageImports: ['@chakra-ui/react', '@chakra-ui/icons', 'framer-motion'],
    // TEMPORARILY DISABLED: Enable turbo for faster builds - FORCING FULL REBUILD
    // turbo: {
    //   rules: {
    //     '*.tsx': {
    //       loaders: ['swc-loader'],
    //       as: '*.js',
    //     },
    //   },
    // },
    // Re-enable CSS optimizer for production (was causing issues on Render)
    optimizeCss: true,
    // Enable faster refresh for large files
    swcMinify: true,
    // Enable instrumentation for server initialization
    instrumentationHook: true,
    // optimisticClientCache defaults to true for proper CSS loading
  },

  // Enable compression
  compress: true,

  // Production source maps for debugging
  productionBrowserSourceMaps: true,

  // Performance optimizations for large dataset
  images: {
    // Optimize image loading for 666+ item images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    // Increase cache for large number of images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 31536000,
    unoptimized: false,
  },

  // Redirects for route changes
  async redirects() {
    return [
      {
        source: '/auth/register',
        destination: '/customer/register',
        permanent: true,
      },
    ];
  },

  // Add custom headers for caching, performance, and security
  async headers() {
    return [
      // Security headers for all routes (HSTS, CSP, etc.)
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      // Cache headers for static assets
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // CRITICAL: CSS files MUST have correct MIME type for Safari iOS
      {
        source: '/_next/static/css/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // CRITICAL: Add cache busting headers to prevent stale chunks
          {
            key: 'X-Content-Hash',
            value: process.env.NEXT_BUILD_ID || Date.now().toString(),
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // CRITICAL: Enable React Strict Mode to catch component issues early
  // This helps identify re-rendering issues that cause infinite loops
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // CRITICAL: Disable aggressive caching to fix Safari 17+ cache issues (iPhone 15-17)
  // Temporary fix for WhereAndWhatStep.tsx being served from cache instead of new build
  generateEtags: false, // Disable ETags to prevent stale cache
  
  // Disable on-demand entry caching
  onDemandEntries: {
    maxInactiveAge: 0, // Disable cache immediately
    pagesBufferLength: 0, // Don't buffer pages in memory
  },
  
  // Disable standalone output - causes CSS loading issues on Render
  // output: 'standalone',
  
  // CRITICAL: Generate unique build ID for cache busting
  // This ensures each deployment has a unique identifier
  generateBuildId: async () => {
    // Use timestamp + random string for unique build ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  },
  
  // Disable compiler console removal (keep for debugging cache issues)
  compiler: {
    removeConsole: false, // Keep console logs to debug cache issues
  },
  
  transpilePackages: ['@speedy-van/shared', '@speedy-van/utils', '@speedy-van/pricing'],
  
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  
  // Optimize webpack for large bundles (666+ items dataset)
  webpack: (config, { dev, isServer, webpack }) => {
    // Removed custom splitChunks configuration to fix CSS loading issue
    // Custom splitChunks was overriding Next.js default CssChunkingPlugin behavior
    // which caused CSS files to be bundled as JavaScript chunks and loaded as <script> tags
    // Next.js default configuration properly separates CSS into .css files with <link> tags

    if (dev && !isServer) {
      // Only disable devtools to prevent ActionQueueContext issue
      config.resolve.alias = {
        ...config.resolve.alias,
        'use-reducer-with-devtools': false,
      };
    }

    // Suppress specific warnings including Zod locale warnings
    config.stats = {
      ...config.stats,
      warningsFilter: [
        // Suppress Zod locale warnings
        /Module not found.*zod.*locale/,
        /Can't resolve.*zod.*locale/,
      // Suppress Stripe-related warnings as requested
      /stripe/i,
      // Suppress bundle size warnings for large dataset
      /Bundle size.*large/,
      /Large bundle size/,
      // Other common warnings to suppress
      /Critical dependency: the request of a dependency is an expression/,
      /Module parse failed.*Unexpected token/,
      ],
    };

    // Handle module resolution for problematic packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // Prevent resolution of problematic modules
      'zod/lib/locales': false,
      // Handle other common issues
      fs: false,
      net: false,
      tls: false,
    };

    // Suppress specific module warnings
    config.ignoreWarnings = [
      // Zod locale warnings
      /Module not found.*zod.*locale/,
      /Can't resolve.*zod.*locale/,
      // Stripe warnings as requested
      /stripe.*warning/i,
      // Bundle size warnings for large dataset
      /Bundle size.*large/i,
      /Large bundle size/i,
      // Other common warnings
      /Critical dependency: the request of a dependency is an expression/,
    ];

    return config;
  },
};

export default nextConfig;