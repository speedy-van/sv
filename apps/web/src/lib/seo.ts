import type { Metadata } from 'next';

export function buildMetadata(base: Partial<Metadata>): Metadata {
  const defaults: Metadata = {
    title: 'Speedy Van',
    description: 'Book a van in minutes. Live tracking, vetted drivers.',
    metadataBase: new URL('https://speedy-van.co.uk'),
    openGraph: {
      title: 'Speedy Van',
      description: 'Book a van in minutes. Live tracking, vetted drivers.',
      type: 'website',
      url: 'https://speedy-van.co.uk/',
      siteName: 'Speedy Van',
      images: [
        { url: '/og/og-home.jpg', width: 1200, height: 630, alt: 'Speedy Van' },
      ],
      locale: 'en_GB',
    },
    twitter: { card: 'summary_large_image' },
  };
  return { ...defaults, ...base } as Metadata;
}
