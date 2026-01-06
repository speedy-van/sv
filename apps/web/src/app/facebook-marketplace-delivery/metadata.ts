import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Facebook Marketplace Pickup & Delivery Service | Speedy Van',
  description:
    'Professional Facebook Marketplace delivery service. We collect furniture from private sellers and deliver to your door. Sofas, beds, wardrobes - fully insured, same-day available.',
  keywords:
    'Facebook Marketplace delivery, Facebook Marketplace pickup, collect from seller, furniture delivery service, marketplace collection, sofa delivery, bed delivery, private seller collection, door to door delivery',
  alternates: {
    canonical: 'https://speedy-van.co.uk/facebook-marketplace-delivery',
  },
  openGraph: {
    title: 'Facebook Marketplace Pickup & Delivery | Speedy Van',
    description:
      'Bought something on Facebook Marketplace? We collect from the seller and deliver to your door. Fully insured, professional service.',
    url: 'https://speedy-van.co.uk/facebook-marketplace-delivery',
    siteName: 'Speedy Van',
    images: [
      {
        url: '/og/og-marketplace.jpg',
        width: 1200,
        height: 630,
        alt: 'Facebook Marketplace delivery service',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Facebook Marketplace Pickup & Delivery | Speedy Van',
    description:
      'We collect your Facebook Marketplace purchases from sellers and deliver to your door. Same-day available.',
  },
};
