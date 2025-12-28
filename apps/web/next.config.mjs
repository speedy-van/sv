/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for large dataset (666+ items)
  experimental: {
    // NOTE: optimizePackageImports caused Chakra UI styles to be tree-shaken differently in production
    // leaving it disabled to keep Emotion style injection order stable across dev/prod
    // CRITICAL: DISABLE CSS optimizer - it causes CSS not to load on Render production
    optimizeCss: false,
    // Disable static error pages generation to prevent prerender issues
    staticGenerationMaxConcurrency: 8,
    staticGenerationMinPagesPerWorker: 25,
  },
  
  // Skip error page generation during build
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // Skip prerendering for error pages and test pages that don't exist
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: false,

  // Enable compression
  compress: true,

  // Hide powered-by header for security
  poweredByHeader: false,

  // Disable production source maps for better performance
  productionBrowserSourceMaps: false,

  // CRITICAL: Disable Next.js Image Optimization - use external CDN instead
  // Next.js image optimization on Render is too slow (60-120s per image)
  // All images now served from Cloudinary CDN with automatic optimization
  images: {
    unoptimized: true, // Disable Next.js optimization completely
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Redirects for route changes
  async redirects() {
    return [
      {
        source: '/auth/register',
        destination: '/customer/register',
        permanent: true,
      },
      {
        source: '/booking',
        destination: '/booking-luxury',
        permanent: false, // Temporary redirect (307) until standard booking page is created
      },
      // Prevent Next.js from trying to prerender error pages
      {
        source: '/500',
        destination: '/',
        permanent: false,
      },
      {
        source: '/404',
        destination: '/',
        permanent: false,
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
          // Content Security Policy - Best Practices
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://*.pusher.com https://widget.trustpilot.com https://*.trustpilot.com https://api.mapbox.com https://*.mapbox.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com https://*.mapbox.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.stripe.com https://api.mapbox.com https://*.mapbox.com https://www.google-analytics.com https://*.pusher.com wss://*.pusher.com https://res.cloudinary.com https://api.cloudinary.com https://*.sentry.io https://*.trustpilot.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://widget.trustpilot.com https://*.trustpilot.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
          // Cross-Origin headers for better security
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(self)',
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
      // Video files - long cache (CDN ready)
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
      // CRITICAL: CSS files MUST have correct MIME type and FORCE reload on new deployments
      {
        source: '/_next/static/css/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Vary',
            value: '*',
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
  
  // CRITICAL: FORCE fresh cache on every deployment (fixes CSS not loading on Render)
  generateEtags: false,
  
  // CRITICAL: Disable all caching for development consistency
  onDemandEntries: {
    maxInactiveAge: 1000 * 60 * 60, // Keep pages in memory for 1 hour (default)
    pagesBufferLength: 5, // Keep 5 pages buffered (default)
  },
  
  // Font optimization is now default in Next.js 15
  // optimizeFonts: true,
  
  // CRITICAL: DO NOT use standalone mode - it breaks CSS loading
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