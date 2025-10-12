interface Service {
  name: string;
  description: string;
  price?: string;
  areaServed?: string[];
}

interface ServiceSchemaProps {
  services: Service[];
  businessName?: string;
  businessUrl?: string;
}

export default function ServiceSchema({ 
  services,
  businessName = 'Speedy Van',
  businessUrl = 'https://speedy-van.co.uk'
}: ServiceSchemaProps) {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessName,
    url: businessUrl,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Moving Services',
      itemListElement: services.map((service, index) => ({
        '@type': 'Offer',
        position: index + 1,
        name: service.name,
        description: service.description,
        ...(service.price && { price: service.price }),
        ...(service.areaServed && { areaServed: service.areaServed.map(area => ({
          '@type': 'Place',
          name: area
        })) })
      }))
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(serviceSchema, null, 2)
      }}
    />
  );
}
