/**
 * Google Analytics 4 Component
 * 
 * Tracks all user interactions and conversions
 * Integrates with Google Ads for conversion tracking
 */

'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Set your Google Analytics ID here if needed
const IS_PRODUCTION = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      pageview(pathname);
    }
  }, [pathname, searchParams]);

  if (!IS_PRODUCTION) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  );
}

// Track page views
export const pageview = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track conversions
export const trackConversion = (conversionId: string, value?: number) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
      currency: 'GBP',
    });
  }
};

// Predefined event trackers
export const trackQuoteRequest = (quoteValue: number) => {
  event({
    action: 'generate_lead',
    category: 'engagement',
    label: 'quote_request',
    value: quoteValue,
  });
};

export const trackBookingStarted = () => {
  event({
    action: 'begin_checkout',
    category: 'ecommerce',
    label: 'booking_started',
  });
};

export const trackBookingCompleted = (bookingValue: number, bookingId: string) => {
  event({
    action: 'purchase',
    category: 'ecommerce',
    label: bookingId,
    value: bookingValue,
  });
  
  // Also track as conversion
  trackConversion('AW-XXXXXXXXX/XXXXXX', bookingValue);
};

export const trackPhoneClick = () => {
  event({
    action: 'phone_click',
    category: 'engagement',
    label: 'contact',
  });
};

export const trackEmailClick = () => {
  event({
    action: 'email_click',
    category: 'engagement',
    label: 'contact',
  });
};

export const trackCTAClick = (ctaLabel: string) => {
  event({
    action: 'cta_click',
    category: 'engagement',
    label: ctaLabel,
  });
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
  }
}


