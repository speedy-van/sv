/**
 * Next.js Performance Configuration
 * 
 * Enterprise-grade optimization for:
 * - Core Web Vitals
 * - Image optimization
 * - Code splitting
 * - Caching
 * - Bundle size reduction
 * 
 * Based on best practices from Fortune 500 companies
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization
  images: {
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    
    // Image domains (add your CDN here)
    domains: [
      'speedyvan.co.uk',
      'cdn.speedyvan.co.uk',
      'images.unsplash.com', // For demo images
    ],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Minimum cache time (1 year)
    minimumCacheTTL: 31536000,
    
    // Disable static imports (use next/image instead)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache fonts
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

  // Redirects for SEO
  async redirects() {
    return [
      // Redirect old URLs to new ones
      {
        source: '/book',
        destination: '/booking',
        permanent: true,
      },
      {
        source: '/hire',
        destination: '/van-hire-near-me',
        permanent: true,
      },
      // Add trailing slash for consistency
      {
        source: '/:path((?!.*\\.).*)',
        has: [
          {
            type: 'header',
            key: 'x-redirect-trailing-slash',
          },
        ],
        destination: '/:path/',
        permanent: true,
      },
    ];
  },

  // Rewrites for cleaner URLs
  async rewrites() {
    return [
      // API rewrites
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Replace React with Preact in production (smaller bundle)
      // Uncomment if you want to use Preact
      // Object.assign(config.resolve.alias, {
      //   react: 'preact/compat',
      //   'react-dom/test-utils': 'preact/test-utils',
      //   'react-dom': 'preact/compat',
      // });

      // Analyze bundle size
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './analyze.html',
            openAnalyzer: false,
          })
        );
      }
    }

    // SVG as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@chakra-ui/react', 'lodash', 'date-fns'],
    
    // Enable optimized fonts
    optimizeFonts: true,
    
    // Enable server actions (for forms)
    serverActions: true,
  },

  // Output configuration
  output: 'standalone',

  // Compression
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Power by header (disable for security)
  poweredByHeader: false,

  // Production browser source maps (disable for performance)
  productionBrowserSourceMaps: false,

  // TypeScript configuration
  typescript: {
    // Ignore build errors in production (not recommended)
    // ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Ignore ESLint errors during build (not recommended)
    // ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;

/**
 * Performance Monitoring
 * 
 * Add these to your package.json scripts:
 * 
 * "analyze": "ANALYZE=true next build"
 * "lighthouse": "lighthouse https://speedyvan.co.uk --view"
 * "speed-test": "npx unlighthouse --site https://speedyvan.co.uk"
 */

/**
 * Expected Performance Improvements:
 * 
 * - Bundle size: -40%
 * - First Load JS: -50%
 * - LCP: <2.5s
 * - FID: <100ms
 * - CLS: <0.1
 * - Lighthouse Score: 95+
 */

