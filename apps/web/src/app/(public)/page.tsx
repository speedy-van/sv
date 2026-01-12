import { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import CookieBanner from '@/components/Consent/CookieBanner';
import CookiePreferencesModal from '@/components/Consent/CookiePreferencesModal';

// PERFORMANCE: Load the home page content with SSR enabled for better initial load
const MobileHomePageContent = dynamic(() => import('./MobileHomePageContent'), {
  ssr: true,
  loading: () => null,
});

export const metadata: Metadata = {
  title: 'Your Move, Made Easy | Same-Day Van Service from £25/hr | Speedy Van',
  description: 'Same-day van service from just £25/hour. Facebook Marketplace pickups, furniture moves, and full house removals across the UK. Fully insured, 5-star rated.',
  keywords: 'same day van service, Facebook Marketplace delivery, Gumtree pickup, furniture removal, man and van UK, house removals, furniture delivery, marketplace collection, private seller pickup, £25 per hour',
  alternates: { canonical: 'https://speedy-van.co.uk/' },
  openGraph: {
    title: 'Your Move, Made Easy | Same-Day Van Service UK',
    description: 'Same-day van service from just £25/hour. Facebook Marketplace pickups, furniture moves, and full house removals across the UK.',
    url: 'https://speedy-van.co.uk/',
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-home.jpg', width: 1200, height: 630, alt: 'Facebook Marketplace pickup and furniture delivery service UK' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'Your Move, Made Easy | Speedy Van',
    description: 'Same-day van service from just £25/hour. Facebook Marketplace pickups, furniture moves, and full house removals across the UK.',
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
  return (
    <>
      <CookieBanner />
      <CookiePreferencesModal />
      <MobileHomePageContent />
    </>
  );
}
