import { Metadata, Viewport } from 'next';
import MobileHomePageContent from './MobileHomePageContent';

export const metadata: Metadata = {
  title: 'Man and Van UK | House Removals & Furniture Delivery | Speedy Van',
  description: 'Professional man and van service across the UK. House removals, furniture delivery, and moving services in London, Manchester, Birmingham, Glasgow, and all UK cities. Same day service from £25/hour.',
  keywords: 'man and van UK, house removals UK, furniture delivery UK, moving services UK, van hire UK, removal company UK, man and van London, man and van Manchester, man and van Birmingham, man and van Glasgow, man and van Edinburgh, man and van Cardiff, man and van Belfast',
  alternates: { canonical: 'https://speedy-van.co.uk/' },
  openGraph: {
    title: 'Man and Van UK | House Removals & Furniture Delivery | Speedy Van',
    description: 'Professional man and van service across the UK. House removals, furniture delivery, and moving services in all UK cities. Same day service from £25/hour.',
    url: 'https://speedy-van.co.uk/',
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-home.jpg', width: 1200, height: 630, alt: 'Professional man and van service across the UK' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Speedy Van',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00C2FF' },
    { media: '(prefers-color-scheme: dark)', color: '#00C2FF' },
  ],
};

export default function HomePage() {
  return <MobileHomePageContent />;
}
