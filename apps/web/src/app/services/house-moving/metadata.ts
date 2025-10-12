import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'House Removals UK | Professional House Moving Company | Speedy Van',
  description: 'Professional house removals service across the UK. Complete house moving solutions including packing, loading, transport and unpacking. From £150. Same day service available. Book your house move online.',
  keywords: 'house removals, house moving, home removals, house removal company, house moving company, home moving service, residential removals, house relocation, moving house service, professional house movers',
  alternates: { canonical: 'https://speedy-van.co.uk/services/house-moving' },
  openGraph: {
    title: 'House Removals UK | Professional House Moving Company',
    description: 'Professional house removals service. Complete house moving solutions from £150. Same day service available.',
    url: 'https://speedy-van.co.uk/services/house-moving',
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-house-moving.jpg', width: 1200, height: 630, alt: 'Professional house removals service' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'House Removals UK | Professional House Moving Company',
    description: 'Professional house removals service. Complete house moving solutions from £150. Book online.',
  },
};

