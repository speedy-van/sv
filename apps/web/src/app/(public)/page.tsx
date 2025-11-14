import { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';

// PERFORMANCE: Load the home page content with SSR enabled for better initial load
const MobileHomePageContent = dynamic(() => import('./MobileHomePageContent'), {
  ssr: true,
  loading: () => null,
});

export const metadata: Metadata = {
  title: 'Man and Van London | Furniture Removal & Moving Services UK',
  description: 'Professional man and van service across London & UK. House removals, furniture delivery, office moving from £25/hour. Same day service available. Book online instantly.',
  keywords: 'man and van London, furniture removal, house removals, moving services UK, van hire, removal company, furniture movers, office removals, same day delivery, man and van near me, cheap man and van, furniture delivery service, removal companies near me',
  alternates: { canonical: 'https://speedy-van.co.uk/' },
  openGraph: {
    title: 'Man and Van London | Furniture Removal & Moving Services UK',
    description: 'Professional man and van service across London & UK. House removals, furniture delivery, office moving from £25/hour. Same day service available.',
    url: 'https://speedy-van.co.uk/',
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-home.jpg', width: 1200, height: 630, alt: 'Professional man and van service in London and across the UK' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'Man and Van London | Furniture Removal & Moving Services UK',
    description: 'Professional man and van service across London & UK. House removals, furniture delivery from £25/hour. Book online instantly.',
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
