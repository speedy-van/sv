"use client";

/**
 * Analytics scripts component for GDPR-compliant tracking
 */

import { useEffect } from 'react';
import { useConsent } from './ConsentProvider';

export default function AnalyticsScripts() {
  const { preferences, hasConsent } = useConsent();

  useEffect(() => {
    if (!hasConsent) {
      return;
    }

    // Only load analytics if user has consented
    if (preferences.analytics) {
      // Google Analytics
      if (process.env.NEXT_PUBLIC_GA_ID) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
        document.head.appendChild(script);

        const configScript = document.createElement('script');
        configScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `;
        document.head.appendChild(configScript);
      }
    }

    // Marketing scripts
    if (preferences.marketing) {
      // Add marketing tracking scripts here
      console.log('Marketing tracking enabled');
    }

    // Preference tracking
    if (preferences.preferences) {
      // Add preference tracking here
      console.log('Preference tracking enabled');
    }
  }, [preferences, hasConsent]);

  // Return null since this component only manages scripts
  return null;
}