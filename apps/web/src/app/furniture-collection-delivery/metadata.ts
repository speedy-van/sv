import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Furniture Delivered, Hassle-Free | Same-Day Collection | Speedy Van',
  description:
    'Same-day furniture collection from just £49. We collect from anywhere in the UK and deliver to your door. Fully insured, 5-star service.',
  keywords:
    'furniture collection, furniture delivery, door to door furniture, sofa collection, bed delivery, wardrobe collection, furniture transport UK, collect furniture from seller, furniture pickup service',
  alternates: {
    canonical: 'https://speedy-van.co.uk/furniture-collection-delivery',
  },
  openGraph: {
    title: 'Furniture Collection & Delivery | Door-to-Door Service | Speedy Van',
    description:
      'Door-to-door furniture collection from anywhere. Private sellers, shops, friends - we collect and deliver with care.',
    url: 'https://speedy-van.co.uk/furniture-collection-delivery',
    siteName: 'Speedy Van',
    images: [
      {
        url: '/og/og-furniture-collection.jpg',
        width: 1200,
        height: 630,
        alt: 'Furniture collection and delivery service',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Furniture Collection & Delivery | Speedy Van',
    description:
      'Professional door-to-door furniture collection and delivery across the UK. Fully insured.',
  },
};
