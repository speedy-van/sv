"use client";

/**
 * Analytics scripts component for GDPR-compliant tracking
 */

import { useEffect } from 'react';
import { useConsent } from './ConsentProvider';

const GTM_ID = 'GTM-M68DQFWW';
const GA_ID = 'G-6QDDY0N36Q';
const ADS_ID = 'AW-17715630822';
type WindowWithDataLayer = typeof window & {
  dataLayer?: unknown[];
};

const ensureScript = (id: string, src: string) => {
  if (document.getElementById(id)) {
    return;
  }
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

export default function AnalyticsScripts() {
  const { preferences, hasConsent } = useConsent();

  useEffect(() => {
    if (!hasConsent || !(preferences.analytics || preferences.marketing)) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const w = window as WindowWithDataLayer;
    w.dataLayer = w.dataLayer || [];

    // Google Tag Manager (for analytics + container control)
    if (preferences.analytics && !document.getElementById('gtm-main')) {
      w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      ensureScript('gtm-main', `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);
    }

    // Google Analytics
    if (preferences.analytics && !document.getElementById('ga-main')) {
      ensureScript('ga-main', `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);

      if (!document.getElementById('ga-config')) {
        const gaConfigScript = document.createElement('script');
        gaConfigScript.id = 'ga-config';
        gaConfigScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true, cookie_flags: 'SameSite=None;Secure' });
        `;
        document.head.appendChild(gaConfigScript);
      }
    }

    // Google Ads (only when marketing consent is given)
    if (preferences.marketing && !document.getElementById('ads-main')) {
      ensureScript('ads-main', `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`);

      if (!document.getElementById('ads-config')) {
        const adsConfigScript = document.createElement('script');
        adsConfigScript.id = 'ads-config';
        adsConfigScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ADS_ID}');
        `;
        document.head.appendChild(adsConfigScript);
      }
    }
  }, [preferences, hasConsent]);

  // Return null since this component only manages scripts
  return null;
}