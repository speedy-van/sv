import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'House Removals UK | Professional Home Moving Service | Speedy Van',
  description: 'Professional house removals across the UK. Full-service moving with packing, careful handling, and reliable delivery. From 1-bed flats to 5-bed houses. Fully insured, competitive prices.',
  keywords: [
    'house removals',
    'home removals',
    'house moving service',
    'removal company',
    'moving house',
    'house movers',
    'domestic removals',
    'home moving company',
    'residential removals',
    'full house removal',
  ].join(', '),
  alternates: {
    canonical: 'https://speedy-van.co.uk/house-removals',
  },
  openGraph: {
    title: 'House Removals UK | Speedy Van',
    description: 'Professional house removals across the UK. Fully insured, competitive prices.',
    url: 'https://speedy-van.co.uk/house-removals',
    siteName: 'Speedy Van',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function HouseRemovalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
