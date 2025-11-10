import type { Metadata } from 'next';
import {
  APP_BASE_URL,
  BRAND_NAME,
  DEFAULT_SOCIAL_IMAGE,
} from '@/lib/seo/constants';

const defaultMetadata: Metadata = {
  title: BRAND_NAME,
  description: 'Book a van in minutes. Live tracking, vetted drivers.',
  metadataBase: new URL(APP_BASE_URL),
  openGraph: {
    title: BRAND_NAME,
    description: 'Book a van in minutes. Live tracking, vetted drivers.',
    type: 'website',
    url: APP_BASE_URL,
    siteName: BRAND_NAME,
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt: BRAND_NAME,
      },
    ],
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
  },
};

export function buildMetadata(base: Partial<Metadata>): Metadata {
  const mergedOpenGraph = {
    ...defaultMetadata.openGraph,
    ...base.openGraph,
    images: base.openGraph?.images ?? defaultMetadata.openGraph?.images,
  };

  const mergedTwitter = {
    ...defaultMetadata.twitter,
    ...base.twitter,
  };

  return {
    ...defaultMetadata,
    ...base,
    openGraph: mergedOpenGraph,
    twitter: mergedTwitter,
  };
}
