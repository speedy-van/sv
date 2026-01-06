import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Single Item Delivery | Sofa, Bed, Appliance Delivery | Speedy Van',
  description: 'Single item delivery service for sofas, beds, appliances, and furniture. 2-man team, stairs handled, fully insured. From £49. Same-day available.',
  keywords: [
    'single item delivery',
    'sofa delivery',
    'bed delivery',
    'appliance delivery',
    'furniture delivery',
    'one item delivery',
    'large item delivery',
    'heavy item delivery',
    'ebay item delivery',
    'marketplace delivery',
  ].join(', '),
  alternates: {
    canonical: 'https://speedy-van.co.uk/single-item-delivery',
  },
  openGraph: {
    title: 'Single Item Delivery | Speedy Van',
    description: 'Single item delivery for sofas, beds, appliances. From £49, same-day available.',
    url: 'https://speedy-van.co.uk/single-item-delivery',
    siteName: 'Speedy Van',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function SingleItemDeliveryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
