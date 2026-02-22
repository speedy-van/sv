import { Metadata, Viewport } from 'next';
import CookieBanner from '@/components/Consent/CookieBanner';
import CookiePreferencesModal from '@/components/Consent/CookiePreferencesModal';
import HomePageContent from './HomePageContent';
import { APP_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Book Man and Van Today from £25/hr | Beat Any Price | Speedy Van',
  description: 'Unbeatable Man With A Van prices from only £25/hour. Guaranteed to beat any price. Van service across England, Scotland, Wales (same-day subject to availability). Facebook Marketplace pickups, furniture moves, and full house removals across the UK. Professional furniture transport, long distance house movers, packers and movers. Fully insured, 5-star rated.',
  keywords: 'man and van, man with a van, book man and van today, man and van prices, cheap man and van, man and van England, man and van Scotland, man and van Wales, same day van service, Facebook Marketplace delivery, Gumtree pickup, furniture removal, house removals, furniture delivery, £25 per hour, furniture transport, long distance house mover, packers and movers, removal companies, large item movers',
  alternates: { canonical: `${APP_BASE_URL}/` },
  openGraph: {
    title: 'Book Man and Van Today from £25/hr | Beat Any Price | Speedy Van',
    description: 'Unbeatable Man With A Van prices from only £25/hour. Van service across England, Scotland, Wales (same-day subject to availability). Facebook Marketplace pickups, furniture moves, and full house removals. Professional furniture transport, guaranteed to beat any price.',
    url: `${APP_BASE_URL}/`,
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-home.jpg', width: 1200, height: 630, alt: 'Facebook Marketplace pickup and furniture delivery service UK' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'Book Man and Van Today from £25/hr | Beat Any Price',
    description: 'Unbeatable Man With A Van prices from only £25/hour across England, Scotland, Wales. Van service available, Facebook Marketplace pickups, furniture moves. Guaranteed to beat any price.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Speedy Van',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00C2FF' },
    { media: '(prefers-color-scheme: dark)', color: '#00C2FF' },
  ],
};

export default function HomePage() {
  // Structured Data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MovingCompany',
    name: 'Speedy Van',
    description: 'Unbeatable Man With A Van prices from only £25/hour. Professional furniture transport, long distance house movers, packers and movers across England, Scotland, Wales. Guaranteed to beat any price.',
    url: APP_BASE_URL,
    logo: `${APP_BASE_URL}/android-chrome-512x512.png`,
    image: `${APP_BASE_URL}/og/og-home.jpg`,
    telephone: '01202 129746',
    priceRange: '£',
    slogan: 'Book Man and Van Today - Guaranteed To Beat Any Price',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '51.5074',
      longitude: '-0.1278',
    },
    areaServed: [
      {
        '@type': 'Country',
        name: 'England',
      },
      {
        '@type': 'Country',
        name: 'Scotland',
      },
      {
        '@type': 'Country',
        name: 'Wales',
      },
      {
        '@type': 'City',
        name: 'London',
      },
      {
        '@type': 'City',
        name: 'Manchester',
      },
      {
        '@type': 'City',
        name: 'Birmingham',
      },
      {
        '@type': 'City',
        name: 'Glasgow',
      },
      {
        '@type': 'City',
        name: 'Edinburgh',
      },
      {
        '@type': 'City',
        name: 'Cardiff',
      },
      {
        '@type': 'City',
        name: 'Liverpool',
      },
      {
        '@type': 'City',
        name: 'Leeds',
      },
      {
        '@type': 'City',
        name: 'Bristol',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Moving Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Furniture Transport',
            description: 'Professional movers to transport sofas, tables, chairs and beds',
            url: `${APP_BASE_URL}/furniture-removal`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Long Distance House Mover',
            description: 'Minimise the effort and hassle of moving house by getting the pros in',
            url: `${APP_BASE_URL}/house-removals`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Packers and Movers',
            description: 'Get your house items packed quickly and moved safely by the experts',
            url: `${APP_BASE_URL}/man-and-van`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Removal Companies',
            description: 'Small removals to moving mansions, our great removal services can help',
            url: `${APP_BASE_URL}/office-removals`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Large Item Movers',
            description: 'Save money by using transporters already heading along your route',
            url: `${APP_BASE_URL}/single-item-delivery`,
          },
        },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '50000',
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CookieBanner />
      <CookiePreferencesModal />
      <HomePageContent />
    </>
  );
}
