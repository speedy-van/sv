/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://speedy-van.co.uk',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,

  // Exclude admin and API routes
  exclude: [
    '/admin/*',
    '/api/*',
    '/auth/*',
    '/driver/*',
    '/customer-portal/*',
    '/driver-portal/*',
    '/portal/*',
    '/offline',
    '/404',
    '/500',
    '/sitemap.xml',
    '/sitemap-*.xml',
    '/robots.txt',
  ],

  // Custom transform for different page types
  transform: async (config, path) => {
    // High priority pages
    const highPriorityPages = [
      '/',
      '/book',
      '/contact',
      '/services',
      '/about',
      '/how-it-works',
    ];

    // Service pages
    const servicePages = [
      '/services/man-and-van',
      '/services/van-and-man',
      '/services/2-men-with-van',
      '/services/van-with-2-men',
      '/services/furniture-removal',
      '/services/house-removal',
      '/services/full-house-removal',
      '/services/1-bedroom-removal',
    ];

    // Location pages pattern
    const isLocationPage =
      path.startsWith('/uk/') ||
      path.includes('man-and-van-') ||
      path.includes('removals-');

    // Service location combinations
    const isServiceLocationPage =
      servicePages.some(service =>
        path.includes(service.replace('/services/', ''))
      ) && isLocationPage;

    let priority = 0.5;
    let changefreq = 'weekly';

    if (highPriorityPages.includes(path)) {
      priority = 1.0;
      changefreq = 'daily';
    } else if (servicePages.includes(path)) {
      priority = 0.9;
      changefreq = 'daily';
    } else if (isServiceLocationPage) {
      priority = 0.8;
      changefreq = 'daily';
    } else if (isLocationPage) {
      priority = 0.7;
      changefreq = 'weekly';
    } else if (path.startsWith('/blog/')) {
      priority = 0.6;
      changefreq = 'weekly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: [
        {
          href: `${config.siteUrl}${path}`,
          hreflang: 'en-GB',
        },
        {
          href: `${config.siteUrl}${path}`,
          hreflang: 'en',
        },
        {
          href: `${config.siteUrl}${path}`,
          hreflang: 'x-default',
        },
      ],
    };
  },

  // Additional paths for dynamic routes
  additionalPaths: async config => {
    const paths = [];
    const fs = require('fs');
    const path = require('path');

    // Load all UK places from places.json
    const placesFile = path.join(__dirname, 'src/data/places.json');
    let allPlaces = [];
    try {
      const placesData = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
      allPlaces = placesData.places || [];
      console.log(`📍 Sitemap: Loading ${allPlaces.length} UK places`);
    } catch (e) {
      console.warn('⚠️ Could not load places.json for sitemap');
    }

    // Blog posts
    const blogPosts = [
      'moving-to-london-guide',
      'professional-packing-tips',
      'cheap-man-and-van-near-me',
      'same-day-man-and-van',
      'student-moving-service',
      'ultimate-london-moving-guide',
    ];

    blogPosts.forEach(post => {
      paths.push({
        loc: `/blog/${post}`,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      });
    });

    // Core services
    const coreServices = [
      'man-and-van',
      'van-and-man',
      '2-men-with-van',
      'van-with-2-men',
      'furniture-removal',
      'house-removal',
      'full-house-removal',
      '1-bedroom-removal',
    ];

    // Generate service pages
    coreServices.forEach(service => {
      paths.push({
        loc: `/services/${service}`,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString(),
      });
    });

    // Major cities get service combinations (top 30 by population)
    const majorCitySlugs = allPlaces
      .filter(p => p.type === 'city')
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, 30)
      .map(p => p.slug);

    // Generate ALL UK place pages from places.json
    allPlaces.forEach(place => {
      // Priority based on type: city > town > village
      let priority = 0.5;
      if (place.type === 'city') priority = 0.8;
      else if (place.type === 'town') priority = 0.6;
      else if (place.type === 'village') priority = 0.5;

      // Main location page
      paths.push({
        loc: `/uk/${place.slug}`,
        changefreq: 'weekly',
        priority,
        lastmod: new Date().toISOString(),
      });

      // Service + location combinations for major cities only
      if (majorCitySlugs.includes(place.slug)) {
        coreServices.forEach(service => {
          paths.push({
            loc: `/uk/${place.slug}/${service}`,
            changefreq: 'daily',
            priority: 0.8,
            lastmod: new Date().toISOString(),
          });
        });
      }
    });

    console.log(`✅ Sitemap: Generated ${paths.length} total paths`);
    return paths;
  },

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/driver/',
          '/customer-portal/',
          '/driver-portal/',
          '/portal/',
          '/offline',
          '/_next/',
          '/uploads/driver-applications/',
          '*.json$',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/driver/',
          '/customer-portal/',
          '/driver-portal/',
          '/portal/',
          '/offline',
        ],
      },
    ],
  },
};
