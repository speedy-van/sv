import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'FAQ | Booking, Payments & Support | Speedy Van',
  description:
    'Frequently asked questions: Klarna & Clearpay, pricing, coverage, heavy items, insurance, payments, changes and cancellations. Call 01202 129746 or email support@speedy-van.co.uk.',
  openGraph: {
    title: 'FAQ | Speedy Van',
    description: 'Answers on booking, pricing, payments and support. Call 01202 129746.',
    url: '/faq',
    images: [{ url: '/og/og-home.jpg', width: 1200, height: 630, alt: 'Speedy Van FAQ' }],
  },
  alternates: { canonical: '/faq' },
});

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
