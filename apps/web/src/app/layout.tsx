import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import '@/styles/critical.css';
import '@/styles/globals.css';
import '@/styles/mobile-enhancements.css';
import '@/styles/mobile-fixes.css';
import '@/styles/video-background.css';
import '@/styles/charts.css';
import '@/styles/responsive-fixes.css';
import '@/styles/mobile-viewport-fixes.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ConsentProvider } from '@/components/Consent/ConsentProvider';
import CookieBanner from '@/components/Consent/CookieBanner';
import CookiePreferencesModal from '@/components/Consent/CookiePreferencesModal';
import { parseConsentCookie } from '@/lib/consent';
import { cookies } from 'next/headers';
import AnalyticsScripts from '@/components/Consent/AnalyticsScripts';
import Providers from '@/components/Providers';
// import MotionProvider from '@/components/MotionProvider'; // Temporarily removed due to framer-motion export * issue
import SchemaProvider from '@/components/Schema/SchemaProvider';
import { VisitorTracker } from '@/components/VisitorTracker';
import { StructuredData } from '@/components/StructuredData';
import {
  APP_BASE_URL,
  BRAND_NAME,
  DEFAULT_SOCIAL_IMAGE,
} from '@/lib/seo/constants';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

const defaultTitle =
  'Man and Van London | From £25/hour | Book Online Now | Speedy Van';
const defaultDescription =
  'Professional man and van service across London & UK. House removals, furniture delivery, office moving from £25/hour. Same-day service available. Trusted by 50,000+ customers. Book instantly online.';
const defaultKeywords =
  'man and van London, man and van near me, furniture removal London, house removals UK, moving services London, van hire with driver, removal company London, furniture movers, office removals, same day man and van, cheap man and van, furniture delivery service, 2 men and van, van and man London';

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
  title: defaultTitle,
  description: defaultDescription,
  keywords: defaultKeywords,
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  alternates: {
    canonical: '/',
    languages: {
      'en-GB': APP_BASE_URL,
      'x-default': APP_BASE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: APP_BASE_URL,
    siteName: BRAND_NAME,
    title: 'Man and Van London | From £25/hour | Trusted by 50,000+ | Speedy Van',
    description: defaultDescription,
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Speedy Van - Professional Man and Van Service in London',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'Man and Van London | From £25/hour | Book Online | Speedy Van',
    description: defaultDescription,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2563EB',
  colorScheme: 'light dark',
};

// Dynamic rendering handled automatically by Next.js when using cookies()
// Removed force-dynamic to fix CSS loading as script tags issue
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialConsent = parseConsentCookie(cookieStore.get('sv_consent')?.value);

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Favicon and App Icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />

        {/* Web App Manifest */}
        <link rel="manifest" href="/site.webmanifest" />

        {/* Windows Tiles */}
        <meta name="msapplication-TileColor" content="#2563EB" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Theme Colors */}
        <meta name="theme-color" content="#2563EB" />

        {/* CRITICAL: Ensure Safari/iOS treats CSS-in-JS styles correctly */}
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

        {/* Mobile and PWA Meta */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Google Ads Global Site Tag - Deferred for performance */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17715630822"
          strategy="lazyOnload"
        />
        <Script id="google-ads-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17715630822');
          `}
        </Script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Script src="/scripts/fix-css.js" strategy="beforeInteractive" />
        <VisitorTracker />
        <StructuredData type="moving-company" />
        <SchemaProvider>
          <Providers>
            <ConsentProvider initialConsent={initialConsent}>
              <CookieBanner />
              <CookiePreferencesModal />
              <AnalyticsScripts />
              <Script
                id="cookie-bar-viewport-adjust"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    (function () {
                      var bar = document.getElementById('cookie-bar');
                      if (!bar || !window.visualViewport) return;

                      var toggleBar = function () {
                        var vv = window.visualViewport;
                        if (!vv) return;
                        bar.style.display = vv.height < 520 ? 'none' : '';
                      };

                      window.visualViewport.addEventListener('resize', toggleBar);
                      toggleBar();
                    })();
                  `,
                }}
              />
              {children}
            </ConsentProvider>
          </Providers>
        </SchemaProvider>
      </body>
    </html>
  );
}
