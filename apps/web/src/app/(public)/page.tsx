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
  title: 'Facebook Marketplace Delivery | Furniture Collection & Man and Van UK',
  description: 'Facebook Marketplace & Gumtree pickup service. We collect from private sellers and deliver to your door. Sofas, beds, wardrobes, appliances. Same day from £25/hour. Fully insured.',
  keywords: 'Facebook Marketplace delivery, Gumtree pickup, collect from seller, furniture delivery, man and van London, sofa delivery, private seller collection, marketplace collection UK, furniture removal, door to door delivery',
  alternates: { canonical: 'https://speedy-van.co.uk/' },
  openGraph: {
    title: 'Facebook Marketplace & Gumtree Pickup | Furniture Delivery UK',
    description: 'We collect from Facebook Marketplace, Gumtree & private sellers and deliver to your door. Sofas, beds, wardrobes. Same day service from £25/hour.',
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
    title: 'Facebook Marketplace & Gumtree Pickup | Speedy Van',
    description: 'We collect from private sellers and deliver to your door. Sofas, beds, wardrobes. Same day service available.',
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
