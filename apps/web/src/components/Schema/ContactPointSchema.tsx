'use client';

import React from 'react';
import Script from 'next/script';

interface ContactPointSchemaProps {
  telephone?: string;
  email?: string;
  contactType?: string;
  availableLanguage?: string[];
  hoursAvailable?: {
    dayOfWeek: string[];
    opens: string;
    closes: string;
  };
}

const ContactPointSchema: React.FC<ContactPointSchemaProps> = ({
  telephone = '+441202129746',
  email = 'support@speedy-van.co.uk',
  contactType = 'customer service',
  availableLanguage = ['English'],
  hoursAvailable = {
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '00:00',
    closes: '23:59',
  },
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPoint',
    telephone: telephone,
    email: email,
    contactType: contactType,
    availableLanguage: availableLanguage,
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hoursAvailable.dayOfWeek,
      opens: hoursAvailable.opens,
      closes: hoursAvailable.closes,
    },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
  };

  return (
    <Script
      id="contact-point-schema"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default ContactPointSchema;
