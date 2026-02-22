import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'How It Works | Book a Van in 3 Steps | Speedy Van',
  description:
    'Book a man and van in three simple steps: get a quote, choose your date, and we handle the rest. Live tracking, vetted drivers, and transparent pricing across the UK.',
  openGraph: {
    title: 'How It Works | Speedy Van',
    description:
      'Book a van in 3 steps. Get a quote, choose your date, we handle the rest. Live tracking and vetted drivers.',
    url: '/how-it-works',
    images: [{ url: '/og/og-home.jpg', width: 1200, height: 630, alt: 'How Speedy Van works' }],
  },
  alternates: { canonical: '/how-it-works' },
});

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
