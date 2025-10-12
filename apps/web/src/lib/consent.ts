/**
 * Consent utilities for GDPR compliance
 */

export interface ConsentCookie {
  preferences: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
  };
  hasConsent: boolean;
  timestamp: number;
}

export function parseConsentCookie(cookieValue?: string): ConsentCookie | null {
  if (!cookieValue || !cookieValue.trim()) {
    return null;
  }

  // Check if it's JSON (starts with {)
  if (cookieValue.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(cookieValue);
      return {
        preferences: {
          necessary: parsed.preferences?.necessary ?? parsed.necessary ?? true,
          functional: parsed.preferences?.functional ?? parsed.functional ?? false,
          analytics: parsed.preferences?.analytics ?? parsed.analytics ?? false,
          marketing: parsed.preferences?.marketing ?? parsed.marketing ?? false,
          preferences: parsed.preferences?.preferences ?? parsed.preferences ?? false,
        },
        hasConsent: parsed.hasConsent ?? false,
        timestamp: parsed.timestamp ?? Date.now(),
      };
    } catch (error) {
      console.error('Failed to parse consent cookie as JSON:', error);
      return null;
    }
  }

  // Fallback: parse as key=value|key=value format
  try {
    const pairs = cookieValue.split('|').map(pair => pair.split('=').map(s => s.trim()));
    const obj: Record<string, string> = {};
    for (const [key, value] of pairs) {
      if (key && value !== undefined) {
        obj[key] = value;
      }
    }

    // Map to our structure
    return {
      preferences: {
        necessary: obj.nec === '1',
        functional: obj.func === '1',
        analytics: obj.ana === '1',
        marketing: obj.mkt === '1',
        preferences: obj.pref === '1' || obj.preferences === '1',
      },
      hasConsent: obj.v === '2', // version 2 indicates consent given
      timestamp: parseInt(obj.ts || '0') || Date.now(),
    };
  } catch (error) {
    console.warn('Consent cookie does not appear to be valid format, skipping parse:', cookieValue.substring(0, 50));
    return null;
  }
}

export function createConsentCookie(consent: ConsentCookie): string {
  return JSON.stringify({
    ...consent,
    timestamp: Date.now(),
  });
}

export function serializeConsentCookie(consent: ConsentCookie): string {
  return createConsentCookie(consent);
}

export function hasValidConsent(cookie?: ConsentCookie): boolean {
  if (!cookie) {
    return false;
  }

  // Check if consent is not older than 1 year
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const isRecent = Date.now() - cookie.timestamp < oneYear;

  return isRecent && cookie.preferences.necessary;
}

export function getConsentLevel(cookie?: ConsentCookie): 'none' | 'necessary' | 'analytics' | 'full' {
  if (!cookie || !hasValidConsent(cookie)) {
    return 'none';
  }

  if (cookie.preferences.necessary && cookie.preferences.analytics && cookie.preferences.marketing && cookie.preferences.preferences) {
    return 'full';
  }

  if (cookie.preferences.necessary && cookie.preferences.analytics) {
    return 'analytics';
  }

  if (cookie.preferences.necessary) {
    return 'necessary';
  }

  return 'none';
}