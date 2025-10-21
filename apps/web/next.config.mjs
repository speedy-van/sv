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
    // Optimize CSS for large components
    optimizeCss: true,
    // Enable faster refresh for large files
    swcMinify: true,
    // Enable instrumentation for server initialization
    instrumentationHook: true,
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

  // Add custom headers for caching and performance
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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

  // Minimal changes to fix ActionQueueContext issue
  reactStrictMode: false,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Suppress specific build warnings while maintaining safety
  onDemandEntries: {
    // Suppress non-critical warnings
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  transpilePackages: ['@speedy-van/shared', '@speedy-van/utils', '@speedy-van/pricing'],
  
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  
  // Optimize webpack for large bundles (666+ items dataset)
  webpack: (config, { dev, isServer, webpack }) => {
    // Performance optimizations for large dataset
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        // Split chunks for better caching with large dataset
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 30,
              chunks: 'all',
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            // Separate chunk for booking-luxury items data
            'booking-items': {
              test: /booking-luxury.*WhereAndWhatStep/,
              name: 'booking-items-data',
              priority: 25,
              chunks: 'all',
            },
          },
        },
      };
    }

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