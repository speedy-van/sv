import { Metadata } from 'next';
import {
  APP_BASE_URL,
  BRAND_NAME,
  DEFAULT_SOCIAL_IMAGE,
} from '@/lib/seo/constants';

const canonicalUrl = `${APP_BASE_URL}/uk/london`;

export const metadata: Metadata = {
  title: `Man and Van London | House Removals London | ${BRAND_NAME}`,
  description:
    'Professional man and van service in London. House removals, furniture delivery, and moving services across all London boroughs. Same day service available from £25/hour.',
  keywords:
    'man and van London, house removals London, furniture delivery London, moving services London, van hire London, removal company London',
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: `Man and Van London | House Removals London | ${BRAND_NAME}`,
    description:
      'Professional man and van service in London from £25/hour. Same day service across all London boroughs. Book online now.',
    url: canonicalUrl,
    siteName: BRAND_NAME,
    images: [
      {
        url: `${APP_BASE_URL}/og/og-london.jpg`,
        width: 1200,
        height: 630,
        alt: 'Man and Van London',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default function LondonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
