import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Found It? We\'ll Deliver It Today | Facebook Marketplace Pickup | Speedy Van',
  description:
    'Same-day Facebook Marketplace pickup from just £25/hour. We collect from sellers and deliver to your door. Fully insured, 5-star rated service.',
  keywords:
    'Facebook Marketplace delivery, Facebook Marketplace pickup, collect from seller, furniture delivery service, marketplace collection, sofa delivery, bed delivery, private seller collection, door to door delivery',
  alternates: {
    canonical: 'https://speedy-van.co.uk/facebook-marketplace-delivery',
  },
  openGraph: {
    title: 'Found It? We\'ll Deliver It Today | Facebook Marketplace Pickup',
    description:
      'Same-day Facebook Marketplace pickup from just £25/hour. We collect from sellers and deliver to your door. Fully insured, 5-star rated.',
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
    title: 'Found It? We\'ll Deliver It Today | Speedy Van',
    description:
      'Same-day Facebook Marketplace pickup from just £25/hour. Fully insured, 5-star service.',
  },
};
