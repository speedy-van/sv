/**
 * SEO Component
 * 
 * Reusable component for page-level SEO optimization
 * Includes meta tags, Open Graph, Twitter Cards, and Schema.org
 */

import Head from 'next/head';
import { SEO_DEFAULTS, SCHEMA_ORG } from '@/config/seo';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  schema?: any;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export default function SEO({
  title,
  description = SEO_DEFAULTS.defaultDescription,
  keywords = SEO_DEFAULTS.defaultKeywords,
  ogImage = SEO_DEFAULTS.ogImage,
  ogType = 'website',
  canonical,
  noindex = false,
  nofollow = false,
  schema,
  breadcrumbs,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SEO_DEFAULTS.siteName}`
    : SEO_DEFAULTS.defaultTitle;
  
  const fullOgImage = ogImage.startsWith('http')
    ? ogImage
    : `${SEO_DEFAULTS.siteUrl}${ogImage}`;
  
  const canonicalUrl = canonical || SEO_DEFAULTS.siteUrl;

  // Combine schemas
  const schemas = [
    SCHEMA_ORG.organization,
    SCHEMA_ORG.localBusiness,
    SCHEMA_ORG.service,
  ];

  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(SCHEMA_ORG.breadcrumb(breadcrumbs));
  }

  if (schema) {
    schemas.push(schema);
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Robots */}
      {(noindex || nofollow) && (
        <meta
          name="robots"
          content={`${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`}
        />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SEO_DEFAULTS.siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content={String(SEO_DEFAULTS.ogImageWidth)} />
      <meta property="og:image:height" content={String(SEO_DEFAULTS.ogImageHeight)} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_GB" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={SEO_DEFAULTS.twitterCard} />
      <meta name="twitter:site" content={SEO_DEFAULTS.twitterSite} />
      <meta name="twitter:creator" content={SEO_DEFAULTS.twitterCreator} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Additional Meta */}
      <meta name="theme-color" content={SEO_DEFAULTS.themeColor} />
      <meta name="msapplication-TileColor" content={SEO_DEFAULTS.tileColor} />
      
      {/* Icons */}
      <link rel="icon" href={SEO_DEFAULTS.favicon} />
      <link rel="apple-touch-icon" href={SEO_DEFAULTS.appleTouchIcon} />
      
      {/* Viewport for mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      
      {/* Mobile Web App Capable */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Schema.org JSON-LD */}
      {schemas.map((schemaItem, index) => (
        <script
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItem) }}
        />
      ))}
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
    </Head>
  );
}

// Preset SEO components for common pages
export function HomeSEO() {
  return (
    <SEO
      title="Fast Delivery Service in Scotland | Same-Day Courier"
      description="Book reliable same-day delivery across Scotland. Instant online quotes, professional drivers, real-time tracking. From £25. Available 7 days a week."
      keywords={[
        'delivery service Scotland',
        'same day courier',
        'van delivery Hamilton',
        'parcel delivery Glasgow',
        'furniture delivery Edinburgh',
        'man and van Scotland',
      ]}
      breadcrumbs={[{ name: 'Home', url: '/' }]}
    />
  );
}

export function BookingSEO() {
  return (
    <SEO
      title="Book Delivery Online - Instant Quote"
      description="Get an instant quote and book your delivery in minutes. Professional drivers, competitive prices, same-day service available. Book now!"
      keywords={[
        'book delivery online',
        'instant delivery quote',
        'online courier booking',
        'van hire Scotland',
      ]}
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'Book Delivery', url: '/booking' },
      ]}
    />
  );
}

export function TrackingSEO() {
  return (
    <SEO
      title="Track Your Delivery - Real-Time Updates"
      description="Track your delivery in real-time with live driver location and ETA updates. Enter your tracking number for instant status."
      keywords={['track delivery', 'parcel tracking', 'delivery status', 'live tracking']}
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'Track Delivery', url: '/track' },
      ]}
    />
  );
}

export function PricingSEO() {
  return (
    <SEO
      title="Delivery Prices - Transparent Pricing"
      description="Clear, upfront pricing with no hidden fees. From £25 for local deliveries. Get an instant quote online. Volume discounts available."
      keywords={[
        'delivery prices Scotland',
        'courier rates',
        'van hire cost',
        'delivery quote',
      ]}
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'Pricing', url: '/pricing' },
      ]}
    />
  );
}

export function AboutSEO() {
  return (
    <SEO
      title="About Us - Professional Delivery Service"
      description="Trusted delivery service based in Hamilton, Scotland. Professional drivers, modern fleet, 1000+ satisfied customers. Learn more about our story."
      keywords={[
        'delivery company Scotland',
        'courier service Hamilton',
        'about Speedy Van',
      ]}
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'About Us', url: '/about' },
      ]}
    />
  );
}

export function ContactSEO() {
  return (
    <SEO
      title="Contact Us - Get in Touch"
      description="Contact Speedy Van for delivery enquiries. Phone, email, or visit our Hamilton office. Quick response guaranteed."
      keywords={['contact delivery service', 'courier enquiries', 'Speedy Van contact']}
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'Contact', url: '/contact' },
      ]}
    />
  );
}

