import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Same Day Delivery | Express Man and Van | Speedy Van',
  description: 'Same day delivery and collection service. Book by 10am for guaranteed same-day pickup. Urgent furniture, appliance, and item delivery across the UK. Fully insured express service.',
  keywords: [
    'same day delivery',
    'express delivery',
    'urgent delivery',
    'same day man and van',
    'express courier',
    'same day collection',
    'urgent furniture delivery',
    'emergency delivery',
    'fast delivery service',
    'same day transport',
  ].join(', '),
  alternates: {
    canonical: 'https://speedy-van.co.uk/same-day-delivery',
  },
  openGraph: {
    title: 'Same Day Delivery | Express Service | Speedy Van',
    description: 'Same day delivery across the UK. Book by 10am for same-day collection.',
    url: 'https://speedy-van.co.uk/same-day-delivery',
    siteName: 'Speedy Van',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function SameDayDeliveryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
