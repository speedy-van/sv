import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'About Speedy Van | Trusted UK Moves & Deliveries',
  description:
    'We make moving and deliveries simple: instant quotes, vetted drivers, live tracking. Fully insured, UK-based support.',
  openGraph: {
    title: 'About Speedy Van | Trusted UK Moves & Deliveries',
    description:
      'We make moving and deliveries simple: instant quotes, vetted drivers, live tracking.',
    url: '/about',
    images: [
      {
        url: '/og/og-about.jpg',
        width: 1200,
        height: 630,
        alt: 'About Speedy Van',
      },
    ],
  },
  alternates: { canonical: '/about' },
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
