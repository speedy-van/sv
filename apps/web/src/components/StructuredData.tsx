/**
 * Structured Data Component
 * 
 * Adds Schema.org JSON-LD structured data to pages for better SEO
 * and integration with Google Business Profile
 */

import Script from 'next/script';

interface StructuredDataProps {
  type?: 'organization' | 'local-business' | 'moving-company' | 'service' | 'breadcrumb';
  data?: any;
}

export function StructuredData({ type = 'moving-company', data }: StructuredDataProps) {
  let structuredData: any = {};

  switch (type) {
    case 'moving-company':
      structuredData = getMovingCompanySchema();
      break;
    case 'organization':
      structuredData = getOrganizationSchema();
      break;
    case 'local-business':
      structuredData = getLocalBusinessSchema();
      break;
    case 'service':
      structuredData = getServiceSchema(data);
      break;
    case 'breadcrumb':
      structuredData = getBreadcrumbSchema(data);
      break;
    default:
      structuredData = getMovingCompanySchema();
  }

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

function getMovingCompanySchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MovingCompany',
    name: 'Speedy Van',
    alternateName: 'Speedy Van Removals Ltd',
    description:
      'Professional moving and delivery services across the UK. House removals, furniture transport, and man and van services from £25/hour.',
    url: 'https://speedy-van.co.uk',
    logo: 'https://speedy-van.co.uk/images/gbp/speedy_van_logo.png',
    image: [
      'https://speedy-van.co.uk/images/gbp/speedy-van-hero-banner.png',
      'https://speedy-van.co.uk/images/gbp/glasgow-service.png',
      'https://speedy-van.co.uk/images/gbp/london-service.png',
      'https://speedy-van.co.uk/images/gbp/speedy-van-manchester-service.png',
    ],
    telephone: '+447901846297',
    email: 'support@speedy-van.co.uk',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Office 2.18, 1 Barrack Street',
      addressLocality: 'Hamilton',
      addressRegion: 'Scotland',
      postalCode: 'ML3 0DG',
      addressCountry: 'GB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '55.7781',
      longitude: '-4.0360',
    },
    areaServed: [
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'AdministrativeArea', name: 'England' },
      { '@type': 'AdministrativeArea', name: 'Scotland' },
      { '@type': 'AdministrativeArea', name: 'Wales' },
      { '@type': 'AdministrativeArea', name: 'Northern Ireland' },
      { '@type': 'City', name: 'London' },
      { '@type': 'City', name: 'Manchester' },
      { '@type': 'City', name: 'Birmingham' },
      { '@type': 'City', name: 'Glasgow' },
      { '@type': 'City', name: 'Edinburgh' },
      { '@type': 'City', name: 'Leeds' },
      { '@type': 'City', name: 'Liverpool' },
      { '@type': 'City', name: 'Bristol' },
      { '@type': 'City', name: 'Cardiff' },
      { '@type': 'City', name: 'Belfast' },
    ],
    priceRange: '££',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:00',
        closes: '22:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday'],
        opens: '08:00',
        closes: '20:00',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '50000',
      bestRating: '5',
      worstRating: '1',
    },
    sameAs: [
      'https://www.facebook.com/speedyvan',
      'https://www.instagram.com/speedyvan',
      'https://www.linkedin.com/company/speedyvan',
      'https://twitter.com/speedyvan',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Moving Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'House Removals',
            description: 'Professional full-house moving services for homes of all sizes',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '50',
            priceCurrency: 'GBP',
            eligibleQuantity: {
              '@type': 'QuantitativeValue',
              value: '1',
              unitText: 'move',
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Man and Van Service',
            description: 'Flexible man and van hire for small to medium moves',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '25',
            priceCurrency: 'GBP',
            eligibleQuantity: {
              '@type': 'QuantitativeValue',
              value: '1',
              unitText: 'hour',
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Same-Day Delivery',
            description: 'Urgent same-day delivery services across the UK',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '50',
            priceCurrency: 'GBP',
            eligibleQuantity: {
              '@type': 'QuantitativeValue',
              value: '1',
              unitText: 'delivery',
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Student Moves',
            description: 'Affordable student relocation services with special discounts',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '40',
            priceCurrency: 'GBP',
            eligibleQuantity: {
              '@type': 'QuantitativeValue',
              value: '1',
              unitText: 'move',
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Office Relocation',
            description: 'Professional business and office moving services',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '75',
            priceCurrency: 'GBP',
            eligibleQuantity: {
              '@type': 'QuantitativeValue',
              value: '1',
              unitText: 'hour',
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Furniture Assembly',
            description: 'Professional furniture assembly and disassembly services',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '30',
            priceCurrency: 'GBP',
            eligibleQuantity: {
              '@type': 'QuantitativeValue',
              value: '1',
              unitText: 'item',
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Packing Service',
            description: 'Professional packing services with high-quality materials',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '20',
            priceCurrency: 'GBP',
            eligibleQuantity: {
              '@type': 'QuantitativeValue',
              value: '1',
              unitText: 'hour',
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Furniture Transport',
            description: 'Safe and secure furniture moving for individual items',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '25',
            priceCurrency: 'GBP',
            eligibleQuantity: {
              '@type': 'QuantitativeValue',
              value: '1',
              unitText: 'hour',
            },
          },
        },
      ],
    },
    founder: {
      '@type': 'Person',
      name: 'Jewan Khalil Saleh',
    },
    foundingDate: '2025-10-08',
    legalName: 'SPEEDY VAN REMOVALS LTD',
    taxID: 'SC865658',
    vatID: 'GB-SC865658',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+447901846297',
        contactType: 'customer service',
        areaServed: 'GB',
        availableLanguage: ['English', 'Arabic'],
      },
      {
        '@type': 'ContactPoint',
        telephone: '+447770498047',
        contactType: 'sales',
        areaServed: 'GB',
        availableLanguage: ['English', 'Arabic'],
      },
    ],
  };
}

function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Speedy Van',
    legalName: 'SPEEDY VAN REMOVALS LTD',
    url: 'https://speedy-van.co.uk',
    logo: 'https://speedy-van.co.uk/images/gbp/speedy_van_logo.png',
    foundingDate: '2025-10-08',
    founder: {
      '@type': 'Person',
      name: 'Jewan Khalil Saleh',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Office 2.18, 1 Barrack Street',
      addressLocality: 'Hamilton',
      addressRegion: 'Scotland',
      postalCode: 'ML3 0DG',
      addressCountry: 'GB',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+447901846297',
      contactType: 'customer service',
      email: 'support@speedy-van.co.uk',
    },
    sameAs: [
      'https://www.facebook.com/speedyvan',
      'https://www.instagram.com/speedyvan',
      'https://www.linkedin.com/company/speedyvan',
      'https://twitter.com/speedyvan',
    ],
  };
}

function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://speedy-van.co.uk/#localbusiness',
    name: 'Speedy Van',
    image: 'https://speedy-van.co.uk/images/gbp/speedy-van-hero-banner.png',
    telephone: '+447901846297',
    email: 'support@speedy-van.co.uk',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Office 2.18, 1 Barrack Street',
      addressLocality: 'Hamilton',
      addressRegion: 'Scotland',
      postalCode: 'ML3 0DG',
      addressCountry: 'GB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 55.7781,
      longitude: -4.036,
    },
    url: 'https://speedy-van.co.uk',
    priceRange: '££',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:00',
        closes: '22:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday'],
        opens: '08:00',
        closes: '20:00',
      },
    ],
  };
}

function getServiceSchema(data: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: data?.serviceType || 'Moving Service',
    provider: {
      '@type': 'Organization',
      name: 'Speedy Van',
      url: 'https://speedy-van.co.uk',
    },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: data?.serviceName || 'Moving Services',
      itemListElement: data?.offers || [],
    },
  };
}

function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export default StructuredData;

