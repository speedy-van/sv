'use client';

import React from 'react';
import { Helmet } from 'react-helmet';

interface LocalBusinessSchemaProps {
  businessName?: string;
  description?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  telephone?: string;
  email?: string;
  website?: string;
  openingHours?: string[];
  priceRange?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
}

const LocalBusinessSchema: React.FC<LocalBusinessSchemaProps> = ({
  businessName = 'Speedy Van (SPEEDY VAN REMOVALS LTD)',
  description = 'Professional moving services across the UK. Fast, reliable, and fully insured van hire and moving solutions. Company No. SC865658, registered in Scotland.',
  address = {
    streetAddress: 'Office 2.18 1 Barrack St',
    addressLocality: 'Hamilton',
    addressRegion: 'South Lanarkshire',
    postalCode: 'ML3 0HS',
    addressCountry: 'GB',
  },
  telephone = '+447901846297',
  email = 'support@speedy-van.co.uk',
  website = 'https://speedy-van.co.uk',
  openingHours = ['Mo-Su 00:00-23:59'],
  priceRange = '££',
  aggregateRating = {
    ratingValue: 4.8,
    reviewCount: 1250,
  },
  geo = {
    latitude: 55.7790,
    longitude: -4.0393,
  },
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessName,
    legalName: 'SPEEDY VAN REMOVALS LTD',
    taxID: 'SC865658',
    description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.streetAddress,
      addressLocality: address.addressLocality,
      addressRegion: address.addressRegion,
      postalCode: address.postalCode,
      addressCountry: address.addressCountry,
    },
    telephone: telephone,
    email: email,
    url: website,
    foundingDate: '2025-10-07',
    openingHours: openingHours,
    priceRange: priceRange,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
    sameAs: [
      'https://facebook.com/speedyvan',
      'https://twitter.com/speedyvan',
      'https://instagram.com/speedyvan',
      'https://linkedin.com/company/speedyvan',
    ],
    serviceArea: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Moving Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Furniture Moving',
            description: 'Professional furniture moving services',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Electronics Transport',
            description: 'Safe transport of electronics and appliances',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Student Moves',
            description: 'Affordable student moving services',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Business Relocation',
            description: 'Professional business relocation services',
          },
        },
      ],
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default LocalBusinessSchema;
