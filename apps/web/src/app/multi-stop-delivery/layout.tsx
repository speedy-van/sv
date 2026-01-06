import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multi-Stop Delivery | Multiple Pickups & Drop-offs | Speedy Van',
  description: 'Multi-stop delivery service for multiple pickups and drop-offs in one trip. Perfect for sellers, charity collections, business deliveries. From £99, optimized routing.',
  keywords: [
    'multi stop delivery',
    'multiple pickups',
    'multiple drop offs',
    'multi drop delivery',
    'route delivery',
    'multiple address delivery',
    'bulk delivery',
    'distribution service',
    'collection service',
    'seller delivery',
  ].join(', '),
  alternates: {
    canonical: 'https://speedy-van.co.uk/multi-stop-delivery',
  },
  openGraph: {
    title: 'Multi-Stop Delivery | Speedy Van',
    description: 'Multiple pickups and drop-offs in one trip. From £99.',
    url: 'https://speedy-van.co.uk/multi-stop-delivery',
    siteName: 'Speedy Van',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function MultiStopDeliveryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
