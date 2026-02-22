/**
 * Google Ads Conversion Tracking Utilities
 *
 * Conversion labels are from Google Ads → Tools & Settings → Conversions.
 * Fires on booking success page when payment is confirmed.
 */

const GOOGLE_ADS_ID = 'AW-17715630822';
const STANDARD_BOOKING_CONVERSION_LABEL = '7393649164';
const LUXURY_BOOKING_CONVERSION_LABEL = '7375337919';

const SEND_TO_STANDARD = `${GOOGLE_ADS_ID}/${STANDARD_BOOKING_CONVERSION_LABEL}`;
const SEND_TO_LUXURY = `${GOOGLE_ADS_ID}/${LUXURY_BOOKING_CONVERSION_LABEL}`;

/**
 * Fire Google Ads conversion event (and GA4 purchase when gtag is available).
 * Call only once per booking from the success page.
 *
 * @param bookingValue - Total booking value in GBP (pounds)
 * @param bookingReference - Unique booking reference (transaction_id)
 * @param isLuxury - Use luxury conversion action when true (booking-luxury)
 */
export const trackBookingConversion = (
  bookingValue: number,
  bookingReference: string,
  isLuxury: boolean = false
): void => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  const sendTo = isLuxury ? SEND_TO_LUXURY : SEND_TO_STANDARD;

  // Google Ads conversion
  window.gtag('event', 'conversion', {
    send_to: sendTo,
    value: bookingValue,
    currency: 'GBP',
    transaction_id: bookingReference,
  });

  // GA4 purchase event (for Analytics)
  window.gtag('event', 'purchase', {
    transaction_id: bookingReference,
    value: bookingValue,
    currency: 'GBP',
    items: [],
  });
};

/**
 * Enhanced booking conversion (alias for luxury flow with tier label).
 * Use for booking-luxury success page.
 */
export const trackBookingConversionEnhanced = (
  bookingValue: number,
  bookingReference: string,
  _serviceTier: string
): void => {
  trackBookingConversion(bookingValue, bookingReference, true);
};
