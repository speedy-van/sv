import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gumtree Pickup & Delivery Service | Collect From Seller | Speedy Van',
  description:
    'Professional Gumtree collection and delivery service. We pick up from private sellers and deliver to your door. Furniture, appliances, large items - fully insured, UK-wide.',
  keywords:
    'Gumtree delivery, Gumtree pickup, Gumtree collection, collect from seller, furniture delivery, private seller collection, Gumtree furniture delivery, door to door delivery UK',
  alternates: {
    canonical: 'https://speedy-van.co.uk/gumtree-pickup-delivery',
  },
  openGraph: {
    title: 'Gumtree Pickup & Delivery Service | Speedy Van',
    description:
      'Found something on Gumtree? We collect from the seller and deliver to your door. Fully insured, professional service.',
    url: 'https://speedy-van.co.uk/gumtree-pickup-delivery',
    siteName: 'Speedy Van',
    images: [
      {
        url: '/og/og-gumtree.jpg',
        width: 1200,
        height: 630,
        alt: 'Gumtree pickup and delivery service',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gumtree Pickup & Delivery | Speedy Van',
    description:
      'We collect your Gumtree purchases from sellers and deliver to your door. Same-day available.',
  },
};
