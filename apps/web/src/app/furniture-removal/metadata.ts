import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Furniture Removal Service UK | Professional Movers | Speedy Van',
  description: 'Professional furniture removal service across the UK. Our expert furniture movers handle everything from single items to full house moves. Safe, reliable, and affordable. Book your furniture removal today.',
  keywords: 'furniture removal, furniture movers, furniture moving service, sofa removal, wardrobe removal, bed removal, furniture transport, professional furniture movers, furniture disposal',
  alternates: { canonical: 'https://speedy-van.co.uk/furniture-removal' },
  openGraph: {
    title: 'Furniture Removal Service UK | Professional Movers | Speedy Van',
    description: 'Professional furniture removal service. Our expert movers handle everything from single items to full house moves.',
    url: 'https://speedy-van.co.uk/furniture-removal',
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-furniture-removal.jpg', width: 1200, height: 630, alt: 'Professional furniture removal service' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'Furniture Removal Service UK | Professional Movers',
    description: 'Professional furniture removal service. Safe, reliable, and affordable. Book today.',
  },
};
