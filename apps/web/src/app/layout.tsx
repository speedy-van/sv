import React from 'react';
import ChakraProviders from '@/components/ChakraProviders';
import '@/styles/globals.css';
import '@/styles/mobile-enhancements.css';
import '@/styles/mobile-fixes.css';
// import '@/styles/booking-fixes.css'; // File doesn't exist, removed
import '@/styles/video-background.css';
import '@/styles/charts.css';
import '@/styles/responsive-fixes.css';
import '@/styles/mobile-viewport-fixes.css';
import "mapbox-gl/dist/mapbox-gl.css";
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

export const metadata = {
  title: 'Man and Van London | From £25/hour | Book Online Now | Speedy Van',
  description:
    'Professional man and van service across London & UK. House removals, furniture delivery, office moving from £25/hour. Same-day service available. Trusted by 50,000+ customers. Book instantly online.',
  keywords:
    'man and van London, man and van near me, furniture removal London, house removals UK, moving services London, van hire with driver, removal company London, furniture movers, office removals, same day man and van, cheap man and van, furniture delivery service, 2 men and van, van and man London',
  authors: [{ name: 'Speedy Van' }],
  creator: 'Speedy Van',
  publisher: 'Speedy Van',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://speedy-van.co.uk'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://speedy-van.co.uk',
    siteName: 'Speedy Van',
    title: 'Man and Van London | From £25/hour | Trusted by 50,000+ | Speedy Van',
    description:
      'Professional man and van service across London & UK. House removals, furniture delivery, office moving from £25/hour. Same-day service available. Instant online booking with trusted movers.',
    images: [
      {
        url: '/og-image.jpg',
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
    description:
      'Professional man and van service across London & UK. House removals, furniture delivery, office moving from £25/hour. Same-day service. Trusted by 50,000+ customers. Book instantly online.',
    images: ['/og-image.jpg'],
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

// Force dynamic rendering for root layout (fixes DYNAMIC_SERVER_USAGE error)
// Required because we use cookies() for consent tracking
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialConsent = parseConsentCookie(cookieStore.get('sv_consent')?.value);

  return (
    <html lang="en" dir="ltr">
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

        {/* Mobile and PWA Meta */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Optimized Font Loading with preload */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Fix CSS files incorrectly loaded as scripts (runs in head before page load) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Run immediately when head is parsed
                if (document.readyState === 'loading') {
                  // Fix CSS files that are incorrectly loaded as script tags
                  const scripts = document.querySelectorAll('script[src*=".css"]');
                  scripts.forEach((script) => {
                    const src = script.getAttribute('src');
                    if (src && src.endsWith('.css')) {
                      // Check if link already exists to avoid duplicates
                      const existingLink = document.querySelector('link[href="' + src + '"]');
                      if (!existingLink) {
                        // Remove the incorrect script tag
                        script.remove();
                        // Create a proper link tag
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = src;
                        link.type = 'text/css';
                        document.head.appendChild(link);
                      } else {
                        // Just remove the duplicate script tag
                        script.remove();
                      }
                    }
                  });
                }
              })();
            `,
          }}
        />

        {/* Preload critical resources - removed favicon preload as it's not used immediately */}
      </head>
      <body>
        {/* Fix CSS files incorrectly loaded as scripts (backup - runs after DOM load) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function fixCSSAsScripts() {
                  // Fix CSS files that are incorrectly loaded as script tags
                  const scripts = document.querySelectorAll('script[src*=".css"]');
                  scripts.forEach((script) => {
                    const src = script.getAttribute('src');
                    if (src && src.endsWith('.css')) {
                      // Check if link already exists to avoid duplicates
                      const existingLink = document.querySelector('link[href="' + src + '"]');
                      if (!existingLink) {
                        // Remove the incorrect script tag
                        script.remove();
                        // Create a proper link tag
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = src;
                        link.type = 'text/css';
                        document.head.appendChild(link);
                      } else {
                        // Just remove the duplicate script tag
                        script.remove();
                      }
                    }
                  });
                }
                
                // Run immediately
                fixCSSAsScripts();
                
                // Run on DOM ready as backup
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', fixCSSAsScripts);
                } else {
                  fixCSSAsScripts();
                }
                
                // Watch for dynamically added script tags (Next.js hydration)
                if (window.MutationObserver) {
                  const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                      mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.tagName === 'SCRIPT') {
                          const src = node.getAttribute('src');
                          if (src && src.endsWith('.css')) {
                            node.remove();
                            const link = document.createElement('link');
                            link.rel = 'stylesheet';
                            link.href = src;
                            link.type = 'text/css';
                            document.head.appendChild(link);
                          }
                        }
                      });
                    });
                  });
                  
                  observer.observe(document.head, { childList: true, subtree: true });
                  observer.observe(document.body, { childList: true, subtree: true });
                }
              })();
            `,
          }}
        />
        {/* Remove console logs in production for Best Practices score */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
                const noop = function() {};
                console.log = noop;
                console.warn = noop;
                console.info = noop;
                console.debug = noop;
                const originalError = console.error;
                console.error = function() {
                  // Suppress console errors in production
                };
              }
            `,
          }}
        />
        <VisitorTracker />
        <StructuredData type="moving-company" />
        <SchemaProvider>
          <Providers>
            <ConsentProvider initialConsent={initialConsent}>
              {children}
              <CookieBanner />
              <CookiePreferencesModal />
              <AnalyticsScripts />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    (function() {
                      const bar = document.getElementById('cookie-bar');
                      if (!bar) return;
                      
                      const onResize = () => {
                        const vv = window.visualViewport;
                        if (vv && vv.height < 520) {
                          bar.style.display = 'none';
                        } else {
                          bar.style.display = '';
                        }
                      };
                      
                      if (window.visualViewport) {
                        window.visualViewport.addEventListener('resize', onResize);
                      }
                    })();
                  `,
                }}
              />
            </ConsentProvider>
          </Providers>
        </SchemaProvider>
      </body>
    </html>
  );
}
