import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Contact Us | Speedy Van',
  description:
    'Get in touch with Speedy Van. Call 01202 129746 or email support@speedy-van.co.uk. We’re here to help with bookings and enquiries.',
  openGraph: {
    title: 'Contact | Speedy Van',
    description: 'Call 01202 129746 or email support@speedy-van.co.uk. We’re here to help.',
    url: '/contact',
    images: [{ url: '/og/og-home.jpg', width: 1200, height: 630, alt: 'Contact Speedy Van' }],
  },
  alternates: { canonical: '/contact' },
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
