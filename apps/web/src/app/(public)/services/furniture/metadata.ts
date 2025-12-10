import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Furniture Removal Service UK | Professional Furniture Movers | Speedy Van',
  description: 'Expert furniture removal and delivery service across the UK. Professional furniture movers handle sofas, wardrobes, beds, and all furniture types. Same day service available from £80. Book online.',
  keywords: 'furniture removal, furniture movers, furniture delivery, furniture moving service, sofa removal, wardrobe removal, bed removal, furniture transport, furniture delivery service, professional furniture movers',
  alternates: { canonical: 'https://speedy-van.co.uk/services/furniture' },
  openGraph: {
    title: 'Furniture Removal Service UK | Professional Furniture Movers',
    description: 'Expert furniture removal and delivery service. Professional movers handle all furniture types. Same day service from £80.',
    url: 'https://speedy-van.co.uk/services/furniture',
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-furniture.jpg', width: 1200, height: 630, alt: 'Professional furniture removal service' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'Furniture Removal Service UK | Professional Furniture Movers',
    description: 'Expert furniture removal and delivery service. Same day service from £80. Book online.',
  },
};

