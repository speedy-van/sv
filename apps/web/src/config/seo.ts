/**
 * SEO Configuration
 * 
 * Centralized SEO settings for maximum Google Ads Quality Score
 * and organic search visibility
 */

export const BUSINESS_INFO = {
  name: 'Speedy Van',
  legalName: 'Speedy Van Ltd',
  description: 'Professional same-day delivery and courier service in Scotland. Fast, reliable van delivery for parcels, furniture, and business logistics.',
  
  // Updated Address
  address: {
    street: '1 Barrack Street',
    office: 'Office 2.18, Hamilton',
    city: 'Hamilton',
    postcode: 'ML3 0DG',
    country: 'United Kingdom',
    countryCode: 'GB',
  },
  
  // Contact Information
  contact: {
    phone: '+44 1202 129746', // Updated company phone
    email: 'hello@speedyvan.co.uk',
    supportEmail: 'support@speedyvan.co.uk',
  },
  
  // Social Media
  social: {
    facebook: 'https://facebook.com/speedyvan',
    twitter: 'https://twitter.com/speedyvan',
    instagram: 'https://instagram.com/speedyvan',
    linkedin: 'https://linkedin.com/company/speedyvan',
  },
  
  // Business Hours
  hours: {
    monday: '08:00-20:00',
    tuesday: '08:00-20:00',
    wednesday: '08:00-20:00',
    thursday: '08:00-20:00',
    friday: '08:00-20:00',
    saturday: '09:00-18:00',
    sunday: '10:00-16:00',
  },
  
  // Geographic Coverage
  serviceArea: [
    'Hamilton',
    'Glasgow',
    'Edinburgh',
    'Motherwell',
    'East Kilbride',
    'Lanarkshire',
    'Scotland',
  ],
  
  // Coordinates for maps
  coordinates: {
    latitude: 55.7783,
    longitude: -4.0387,
  },
};

export const SEO_DEFAULTS = {
  siteName: 'Speedy Van',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://speedyvan.co.uk',
  defaultTitle: 'Speedy Van - Fast & Reliable Delivery Service in Scotland',
  defaultDescription: 'Professional same-day delivery and courier service across Scotland. Book online for instant quotes. Trusted by 1000+ customers. Available 7 days a week.',
  defaultKeywords: [
    'delivery service Scotland',
    'courier Hamilton',
    'same day delivery Glasgow',
    'van hire Scotland',
    'furniture delivery',
    'parcel delivery',
    'man and van Hamilton',
    'removal service',
    'logistics Scotland',
    'express delivery',
  ],
  
  // Open Graph defaults
  ogImage: '/images/og-image.jpg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  
  // Twitter Card defaults
  twitterCard: 'summary_large_image',
  twitterSite: '@speedyvan',
  twitterCreator: '@speedyvan',
  
  // Additional meta
  themeColor: '#00C2FF',
  tileColor: '#00C2FF',
  favicon: '/favicon.ico',
};

// Page-specific SEO configurations
export const PAGE_SEO = {
  home: {
    title: 'Speedy Van - Fast Delivery Service in Scotland | Same-Day Courier',
    description: 'Book reliable same-day delivery across Scotland. Instant online quotes, professional drivers, real-time tracking. From £25. Available 7 days a week.',
    keywords: [
      'delivery service Scotland',
      'same day courier',
      'van delivery Hamilton',
      'parcel delivery Glasgow',
      'furniture delivery Edinburgh',
    ],
  },
  
  booking: {
    title: 'Book Delivery Online - Instant Quote | Speedy Van',
    description: 'Get an instant quote and book your delivery in minutes. Professional drivers, competitive prices, same-day service available. Book now!',
    keywords: [
      'book delivery online',
      'instant delivery quote',
      'online courier booking',
      'van hire Scotland',
    ],
  },
  
  tracking: {
    title: 'Track Your Delivery - Real-Time Updates | Speedy Van',
    description: 'Track your delivery in real-time with live driver location and ETA updates. Enter your tracking number for instant status.',
    keywords: [
      'track delivery',
      'parcel tracking',
      'delivery status',
      'live tracking',
    ],
  },
  
  pricing: {
    title: 'Delivery Prices - Transparent Pricing | Speedy Van',
    description: 'Clear, upfront pricing with no hidden fees. From £25 for local deliveries. Get an instant quote online. Volume discounts available.',
    keywords: [
      'delivery prices Scotland',
      'courier rates',
      'van hire cost',
      'delivery quote',
    ],
  },
  
  about: {
    title: 'About Us - Professional Delivery Service | Speedy Van',
    description: 'Trusted delivery service based in Hamilton, Scotland. Professional drivers, modern fleet, 1000+ satisfied customers. Learn more about our story.',
    keywords: [
      'delivery company Scotland',
      'courier service Hamilton',
      'about Speedy Van',
    ],
  },
  
  contact: {
    title: 'Contact Us - Get in Touch | Speedy Van',
    description: 'Contact Speedy Van for delivery enquiries. Phone, email, or visit our Hamilton office. Quick response guaranteed.',
    keywords: [
      'contact delivery service',
      'courier enquiries',
      'Speedy Van contact',
    ],
  },
};

// Schema.org structured data
export const SCHEMA_ORG = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BUSINESS_INFO.name,
    legalName: BUSINESS_INFO.legalName,
    url: SEO_DEFAULTS.siteUrl,
    logo: `${SEO_DEFAULTS.siteUrl}/logo.png`,
    description: BUSINESS_INFO.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${BUSINESS_INFO.address.office}, ${BUSINESS_INFO.address.street}`,
      addressLocality: BUSINESS_INFO.address.city,
      postalCode: BUSINESS_INFO.address.postcode,
      addressCountry: BUSINESS_INFO.address.countryCode,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: BUSINESS_INFO.contact.phone,
      contactType: 'customer service',
      email: BUSINESS_INFO.contact.email,
      areaServed: 'GB',
      availableLanguage: ['en'],
    },
    sameAs: Object.values(BUSINESS_INFO.social),
  },
  
  localBusiness: {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SEO_DEFAULTS.siteUrl}/#localbusiness`,
    name: BUSINESS_INFO.name,
    image: `${SEO_DEFAULTS.siteUrl}/logo.png`,
    description: BUSINESS_INFO.description,
    url: SEO_DEFAULTS.siteUrl,
    telephone: BUSINESS_INFO.contact.phone,
    email: BUSINESS_INFO.contact.email,
    priceRange: '££',
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${BUSINESS_INFO.address.office}, ${BUSINESS_INFO.address.street}`,
      addressLocality: BUSINESS_INFO.address.city,
      postalCode: BUSINESS_INFO.address.postcode,
      addressCountry: BUSINESS_INFO.address.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS_INFO.coordinates.latitude,
      longitude: BUSINESS_INFO.coordinates.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '10:00',
        closes: '16:00',
      },
    ],
    areaServed: BUSINESS_INFO.serviceArea.map((area) => ({
      '@type': 'City',
      name: area,
    })),
  },
  
  service: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Delivery Service',
    provider: {
      '@type': 'LocalBusiness',
      name: BUSINESS_INFO.name,
    },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Delivery Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Same-Day Delivery',
            description: 'Fast same-day delivery service across Scotland',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Furniture Delivery',
            description: 'Professional furniture and large item delivery',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Parcel Delivery',
            description: 'Reliable parcel and package delivery',
          },
        },
      ],
    },
  },
  
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SEO_DEFAULTS.siteUrl}${item.url}`,
    })),
  }),
};

// Google Ads optimization
export const GOOGLE_ADS_CONFIG = {
  // Conversion tracking
  conversionLabel: 'CONVERSION_LABEL', // Update with real label
  conversionId: 'AW-XXXXXXXXXX', // Update with real ID
  
  // Phone call tracking
  phoneConversionLabel: 'PHONE_CONVERSION_LABEL',
  
  // Landing page optimization
  landingPageOptimization: {
    fastLoading: true,
    mobileOptimized: true,
    clearCTA: true,
    relevantContent: true,
    easyNavigation: true,
    trustSignals: true,
  },
  
  // Quality Score factors
  qualityScoreFactors: {
    expectedCTR: 'high',
    adRelevance: 'high',
    landingPageExperience: 'high',
  },
};

// Robots.txt configuration
export const ROBOTS_TXT = `# Speedy Van - Robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /driver/
Disallow: /_next/
Disallow: /static/

# Sitemaps
Sitemap: ${SEO_DEFAULTS.siteUrl}/sitemap.xml
Sitemap: ${SEO_DEFAULTS.siteUrl}/sitemap-pages.xml
Sitemap: ${SEO_DEFAULTS.siteUrl}/sitemap-blog.xml

# Crawl-delay
Crawl-delay: 1
`;

export default {
  BUSINESS_INFO,
  SEO_DEFAULTS,
  PAGE_SEO,
  SCHEMA_ORG,
  GOOGLE_ADS_CONFIG,
  ROBOTS_TXT,
};

