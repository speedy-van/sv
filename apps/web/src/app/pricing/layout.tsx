import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Pricing | Man and Van Rates from £25/hr | Speedy Van',
  description:
    'Transparent man and van pricing from £25/hour. See how we calculate quotes: distance, crew size, and optional extras. No hidden fees.',
  openGraph: {
    title: 'Pricing | Speedy Van',
    description: 'Man and van from £25/hr. Transparent pricing, no hidden fees.',
    url: '/pricing',
    images: [{ url: '/og/og-home.jpg', width: 1200, height: 630, alt: 'Speedy Van pricing' }],
  },
  alternates: { canonical: '/pricing' },
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
