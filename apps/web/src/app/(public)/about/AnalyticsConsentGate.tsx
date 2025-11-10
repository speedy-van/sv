'use client';

import { useEffect, useState } from 'react';
import { parseConsentCookie } from '@/lib/consent';
import AnalyticsClient from './AnalyticsClient';

const CONSENT_COOKIE_KEY = 'sv_consent';

function getConsent(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const cookies = document.cookie.split(';');
    const consentCookie = cookies
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith(`${CONSENT_COOKIE_KEY}=`));

    if (!consentCookie) return false;

    const value = consentCookie.split('=')[1] ?? '';
    const parsed = parseConsentCookie(decodeURIComponent(value));
    return Boolean(parsed?.preferences?.analytics);
  } catch {
    return false;
  }
}

export default function AnalyticsConsentGate() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(getConsent());
  }, []);

  if (!enabled) {
    return null;
  }

  return <AnalyticsClient />;
}

