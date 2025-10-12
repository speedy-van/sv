/**
 * Service Page Schema Component
 * 
 * Adds comprehensive Schema.org JSON-LD structured data for service pages
 * Includes Service, FAQPage, and BreadcrumbList schemas
 */

import Script from 'next/script';

interface ServicePageSchemaProps {
  serviceName: string;
  serviceDescription: string;
  serviceUrl: string;
  price?: string;
  priceDescription?: string;
  faqs?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export function ServicePageSchema({
  serviceName,
  serviceDescription,
  serviceUrl,
  price,
  priceDescription,
  faqs,
  breadcrumbs,
}: ServicePageSchemaProps) {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: serviceName,
    name: serviceName,
    description: serviceDescription,
    url: serviceUrl,
    provider: {
      '@type': 'MovingCompany',
      name: 'Speedy Van',
      url: 'https://speedy-van.co.uk',
      telephone: '+447901846297',
      email: 'support@speedy-van.co.uk',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Office 2.18, Hamilton, 1 Barrack Street',
        addressLocality: 'Hamilton',
        addressRegion: 'Scotland',
        postalCode: 'ML3 0DG',
        addressCountry: 'GB',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '50000',
        bestRating: '5',
        worstRating: '1',
      },
    },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price,
        priceCurrency: 'GBP',
        description: priceDescription,
        availability: 'https://schema.org/InStock',
        validFrom: new Date().toISOString(),
      },
    }),
  };

  const faqSchema = faqs && faqs.length > 0 ? {
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

  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  } : null;

  return (
    <>
      <Script
        id="service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {faqSchema && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
    </>
  );
}

export default ServicePageSchema;

