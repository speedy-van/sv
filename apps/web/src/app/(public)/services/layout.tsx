import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Services | Man and Van, Removals & Delivery | Speedy Van',
  description:
    'House removals, furniture delivery, office moves, same-day delivery, and more. Professional man and van services across the UK. Transparent pricing and live tracking.',
  openGraph: {
    title: 'Services | Speedy Van',
    description:
      'House removals, furniture delivery, office moves, same-day delivery. Professional man and van across the UK.',
    url: '/services',
    images: [{ url: '/og/og-home.jpg', width: 1200, height: 630, alt: 'Speedy Van services' }],
  },
  alternates: { canonical: '/services' },
});

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
