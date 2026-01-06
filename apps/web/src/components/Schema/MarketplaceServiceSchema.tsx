/**
 * Schema.org Structured Data for Marketplace Delivery Pages
 * Provides LocalBusiness + Service schema for SEO
 */

interface MarketplaceServiceSchemaProps {
  serviceName: string;
  serviceDescription: string;
  serviceUrl: string;
  platform?: 'facebook' | 'gumtree' | 'ebay' | 'general';
  areaServed?: string[];
  priceRange?: string;
  faqs?: Array<{ question: string; answer: string }>;
}

export default function MarketplaceServiceSchema({
  serviceName,
  serviceDescription,
  serviceUrl,
  platform = 'general',
  areaServed = ['United Kingdom', 'England', 'Wales', 'Scotland'],
  priceRange = '£49 - £299',
  faqs = [],
}: MarketplaceServiceSchemaProps) {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://speedy-van.co.uk/#organization',
    name: 'Speedy Van',
    alternateName: 'Speedy Van UK',
    url: 'https://speedy-van.co.uk',
    logo: 'https://speedy-van.co.uk/logo.png',
    image: 'https://speedy-van.co.uk/og/og-home.jpg',
    telephone: '+441202129746',
    email: 'hello@speedy-van.co.uk',
    priceRange: priceRange,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
      addressRegion: 'England',
    },
    areaServed: areaServed.map((area) => ({
      '@type': 'Place',
      name: area,
    })),
    sameAs: [
      'https://www.facebook.com/speedyvanuk',
      'https://twitter.com/speedyvan',
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '07:00',
        closes: '22:00',
      },
    ],
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description: serviceDescription,
    url: serviceUrl,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Speedy Van',
      url: 'https://speedy-van.co.uk',
    },
    serviceType: 'Furniture Delivery',
    areaServed: areaServed.map((area) => ({
      '@type': 'Place',
      name: area,
    })),
    offers: {
      '@type': 'Offer',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'GBP',
        minPrice: '49',
        price: priceRange,
      },
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString().split('T')[0],
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${serviceName} Options`,
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Small Item Collection',
          price: '49',
          priceCurrency: 'GBP',
          description: 'Chairs, small tables, single items',
        },
        {
          '@type': 'Offer',
          name: 'Sofa & Bed Delivery',
          price: '79',
          priceCurrency: 'GBP',
          description: '2-3 seater sofas, double beds with 2-man team',
        },
        {
          '@type': 'Offer',
          name: 'Large Item Delivery',
          price: '99',
          priceCurrency: 'GBP',
          description: 'Corner sofas, wardrobes, appliances',
        },
      ],
    },
  };

  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://speedy-van.co.uk',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: serviceName,
        item: serviceUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema, null, 2),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema, null, 2),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema, null, 2),
        }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema, null, 2),
          }}
        />
      )}
    </>
  );
}
