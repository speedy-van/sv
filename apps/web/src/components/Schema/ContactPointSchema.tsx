'use client';

import React from 'react';
import { Helmet } from 'react-helmet';

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
  telephone = '+447901846297',
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
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default ContactPointSchema;
