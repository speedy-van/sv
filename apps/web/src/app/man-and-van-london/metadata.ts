import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Man and Van London | Same Day Service from £25/Hour | Speedy Van',
  description: 'Professional man and van service in London. Same day service from £25/hour. We cover all of London for furniture delivery, house moves, and more. Book your trusted London man and van online in minutes.',
  keywords: 'man and van london, man with van london, man and van service london, london man and van, cheap man and van london, same day man and van london, furniture delivery london, house removals london, moving service london',
  alternates: { canonical: 'https://speedy-van.co.uk/man-and-van-london' },
  openGraph: {
    title: 'Man and Van London | Same Day Service from £25/Hour',
    description: 'Professional man and van service in London. Same day service from £25/hour. We cover all of London for furniture delivery, house moves, and more.',
    url: 'https://speedy-van.co.uk/man-and-van-london',
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-man-and-van-london.jpg', width: 1200, height: 630, alt: 'Professional man and van service in London' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'Man and Van London | Same Day Service from £25/Hour',
    description: 'Professional man and van service in London from £25/hour. Book online in minutes.',
  },
};
