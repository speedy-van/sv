import type { Metadata } from 'next';
import { APP_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Storage Pickup & Delivery | Self Storage Transport | Speedy Van',
  description: 'Storage pickup and delivery service. We transport items to and from any self-storage facility. Big Yellow, Safestore, Access and more. From £79, fully insured.',
  keywords: [
    'storage delivery',
    'storage pickup',
    'self storage transport',
    'storage unit delivery',
    'storage collection',
    'storage movers',
    'big yellow delivery',
    'safestore transport',
    'storage facility delivery',
    'items to storage',
  ].join(', '),
  alternates: {
    canonical: `${APP_BASE_URL}/storage-services`,
  },
  openGraph: {
    title: 'Storage Pickup & Delivery | Speedy Van',
    description: 'Transport to and from any storage facility. From £79, fully insured.',
    url: `${APP_BASE_URL}/storage-services`,
    siteName: 'Speedy Van',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function StorageServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
