/**
 * Google Ads Conversion Tracking Utilities
 * 
 * IMPORTANT: Replace the conversion labels with actual values from Google Ads:
 * 1. Go to Google Ads → Tools & Settings → Conversions
 * 2. Create/find your conversion actions
 * 3. Copy the conversion labels and update the constants below
 */

// Google Ads Conversion ID (kept for documentation/reference)
const GOOGLE_ADS_ID = 'AW-17715630822';

// Verified Conversion Labels from Google Ads (Updated: Nov 23, 2025)
const STANDARD_BOOKING_CONVERSION_LABEL = '7393649164'; // Standard booking conversion
const LUXURY_BOOKING_CONVERSION_LABEL = '7375337919'; // Luxury booking conversion

const logManualTrackingDisabled = (context: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[tracking-disabled:${context}] Manual Google Ads conversion tracking has been disabled in favour of page-load conversions on /booking/success and /booking-luxury/success.`
    );
  }
};

/**
 * Track completed booking conversion
 * Fires on the booking success page after payment
 * 
 * @param bookingValue - Total booking value in GBP (pounds, not pence)
 * @param bookingReference - Unique booking reference ID
 */
export const trackBookingConversion = (
  bookingValue: number,
  bookingReference: string
): void => {
  logManualTrackingDisabled(
    `standard:${GOOGLE_ADS_ID}/${STANDARD_BOOKING_CONVERSION_LABEL}:${bookingReference}:${bookingValue}`
  );
};

/**
 * Enhanced booking conversion with item details
 * Use this for more detailed tracking with Google Analytics 4
 */
export const trackBookingConversionEnhanced = (
  bookingValue: number,
  bookingReference: string,
  serviceTier: string
): void => {
  logManualTrackingDisabled(
    `enhanced:${GOOGLE_ADS_ID}/${STANDARD_BOOKING_CONVERSION_LABEL}:${bookingReference}:${bookingValue}:${serviceTier}`
  );
};
