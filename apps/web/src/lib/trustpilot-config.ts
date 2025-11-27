/**
 * Trustpilot Configuration and Utilities
 *
 * Centralizes Trustpilot widget configuration using the official TrustBox snippet values.
 * All configuration comes from environment variables.
 */

/**
 * Trustpilot configuration interface
 */
export interface TrustpilotConfig {
  businessUnitId: string;
  templateId: string;
  token: string;
  locale: string;
  widgetScriptUrl: string;
  reviewUrl: string;
  isConfigured: boolean;
}

/**
 * Diagnostic information for debugging Trustpilot issues
 */
export interface TrustpilotDiagnostics {
  origin: string;
  businessUnitId: string;
  templateId: string;
  token: string;
  locale: string;
  widgetUrl: string;
  expectedDomains: string[];
  isProduction: boolean;
  timestamp: string;
}

/**
 * Get Trustpilot configuration from environment variables
 * Uses the official TrustBox snippet configuration
 */
export function getTrustpilotConfig(): TrustpilotConfig {
  const businessUnitId = process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID || '68b0fc8a6ad677c356e83f14';
  const templateId = process.env.NEXT_PUBLIC_TRUSTPILOT_TEMPLATE_ID || '56278e9abfbbba0bdcd568bc';
  const token = process.env.NEXT_PUBLIC_TRUSTPILOT_TOKEN || '6c5f8843-4381-4cb0-aecb-26359eb40d5e';
  const locale = process.env.NEXT_PUBLIC_TRUSTPILOT_LOCALE || 'en-US';

  // Validate businessUnitId format (should be a hex string)
  const isValid = /^[a-f0-9]{24}$/i.test(businessUnitId);

  // Development-only validation warnings
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    if (!isValid) {
      console.warn(
        '⚠️ Trustpilot businessUnitId appears invalid:',
        businessUnitId,
        '\nExpected format: 24-character hex string (e.g., 68b0fc8a6ad677c356e83f14)'
      );
    }
    if (!process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID) {
      console.warn('⚠️ NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID is not set in environment');
    }
    if (!process.env.NEXT_PUBLIC_TRUSTPILOT_TEMPLATE_ID) {
      console.warn('⚠️ NEXT_PUBLIC_TRUSTPILOT_TEMPLATE_ID is not set in environment');
    }
    if (!process.env.NEXT_PUBLIC_TRUSTPILOT_TOKEN) {
      console.warn('⚠️ NEXT_PUBLIC_TRUSTPILOT_TOKEN is not set in environment');
    }
  }

  return {
    businessUnitId,
    templateId,
    token,
    locale,
    widgetScriptUrl: 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js',
    reviewUrl: 'https://www.trustpilot.com/review/speedy-van.co.uk',
    isConfigured: !!businessUnitId && isValid && !!templateId && !!token,
  };
}

/**
 * Generate Trustpilot widget iframe URL for diagnostics
 * Matches the official TrustBox URL structure
 */
export function getTrustpilotWidgetUrl(
  businessUnitId: string,
  templateId: string,
  token: string,
  locale: string = 'en-US'
): string {
  if (typeof window === 'undefined') return '';

  const params = new URLSearchParams({
    businessunitId: businessUnitId,
    locale: locale,
  });

  const hashParams = new URLSearchParams({
    businessunitId: businessUnitId,
    locale: locale,
    token: token,
  });

  return `https://widget.trustpilot.com/trustboxes/${templateId}/index.html?${params.toString()}#${hashParams.toString()}`;
}

/**
 * Get diagnostic information for troubleshooting
 * Only runs in development mode
 */
export function getTrustpilotDiagnostics(
  businessUnitId?: string,
  templateId?: string,
  token?: string,
  locale?: string
): TrustpilotDiagnostics | null {
  // Only provide diagnostics in development
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const config = getTrustpilotConfig();
  const finalBusinessUnitId = businessUnitId || config.businessUnitId;
  const finalTemplateId = templateId || config.templateId;
  const finalToken = token || config.token;
  const finalLocale = locale || config.locale;

  return {
    origin: window.location.origin,
    businessUnitId: finalBusinessUnitId,
    templateId: finalTemplateId,
    token: finalToken,
    locale: finalLocale,
    widgetUrl: getTrustpilotWidgetUrl(finalBusinessUnitId, finalTemplateId, finalToken, finalLocale),
    expectedDomains: [
      'https://speedy-van.co.uk',
      'https://www.speedy-van.co.uk',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    isProduction: process.env.NODE_ENV !== 'development',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log Trustpilot diagnostics (development only)
 * Shows current configuration and expected setup
 */
export function logTrustpilotDiagnostics(
  businessUnitId?: string,
  templateId?: string,
  token?: string,
  locale?: string
): void {
  const diagnostics = getTrustpilotDiagnostics(businessUnitId, templateId, token, locale);

  if (!diagnostics) return;

  console.group('🔍 Trustpilot Widget Diagnostics');
  console.log('Current Origin:', diagnostics.origin);
  console.log('Business Unit ID:', diagnostics.businessUnitId);
  console.log('Template ID:', diagnostics.templateId);
  console.log('Token:', diagnostics.token);
  console.log('Locale:', diagnostics.locale);
  console.log('Expected Whitelisted Domains:', diagnostics.expectedDomains);
  console.log('Widget URL:', diagnostics.widgetUrl);
  console.log('Timestamp:', diagnostics.timestamp);

  // Check if current domain is in expected list
  if (!diagnostics.expectedDomains.includes(diagnostics.origin)) {
    console.warn(
      '⚠️ Current origin not in expected domains list.',
      '\nIf you see 403 errors, this domain may need to be whitelisted in Trustpilot dashboard.'
    );
  }

  console.groupEnd();
}

/**
 * Check if Trustpilot script is already loaded
 */
export function isTrustpilotScriptLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    document.querySelector('script[src*="tp.widget.bootstrap.min.js"]') ||
    (window as any).Trustpilot
  );
}

/**
 * Initialize Trustpilot widget from element
 */
export function initTrustpilotWidget(element: Element | null, force: boolean = true): void {
  if (typeof window === 'undefined' || !element) return;

  if ((window as any).Trustpilot && typeof (window as any).Trustpilot.loadFromElement === 'function') {
    try {
      (window as any).Trustpilot.loadFromElement(element, force);
    } catch (error) {
      // Silently handle errors - Trustpilot may fail due to 403
      if (process.env.NODE_ENV === 'development') {
        console.warn('Trustpilot widget initialization failed:', error);
      }
    }
  }
}

/**
 * Load Trustpilot script and initialize widgets
 * Returns cleanup function
 */
export function loadTrustpilotWidget(
  businessUnitId: string,
  onError?: (error: Error) => void
): () => void {
  if (typeof window === 'undefined' || !businessUnitId) {
    return () => {};
  }

  // Check if script is already loaded
  if (isTrustpilotScriptLoaded()) {
    // Script already loaded, just initialize widgets
    const widgets = document.querySelectorAll('.trustpilot-widget');
    widgets.forEach(widget => initTrustpilotWidget(widget, true));
    return () => {};
  }

  // Create and load the script
  const script = document.createElement('script');
  script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
  script.async = true;
  script.defer = true;

  script.onload = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Trustpilot widget script loaded successfully');
    }
    
    // Initialize widgets after script loads
    setTimeout(() => {
      const widgets = document.querySelectorAll('.trustpilot-widget');
      widgets.forEach(widget => initTrustpilotWidget(widget, true));
    }, 100);
  };

  script.onerror = () => {
    const error = new Error('Failed to load Trustpilot script');
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Failed to load Trustpilot widget script');
    }
    if (onError) {
      onError(error);
    }
  };

  document.head.appendChild(script);

  // Return cleanup function
  return () => {
    const existingScript = document.querySelector('script[src*="tp.widget.bootstrap.min.js"]');
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript);
    }
  };
}
