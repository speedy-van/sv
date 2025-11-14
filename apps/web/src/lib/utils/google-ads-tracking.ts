/**
 * Google Ads Conversion Tracking Utilities
 * 
 * IMPORTANT: Replace the conversion labels with actual values from Google Ads:
 * 1. Go to Google Ads → Tools & Settings → Conversions
 * 2. Create/find your conversion actions
 * 3. Copy the conversion labels and update the constants below
 */

// Google Ads Conversion ID
const GOOGLE_ADS_ID = 'AW-17715630822';

// TODO: Replace these with actual conversion labels from Google Ads
const CALL_CONVERSION_LABEL = 'REPLACE_WITH_CALL_CONVERSION_LABEL';
const BOOKING_CONVERSION_LABEL = 'REPLACE_WITH_BOOKING_CONVERSION_LABEL';

/**
 * Track phone call button click conversion
 * Fires when user clicks any "Call Now" or "Call Us" button
 */
export const trackCallConversion = (): void => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    console.warn('gtag not available - conversion tracking skipped');
    return;
  }

  try {
    window.gtag('event', 'conversion', {
      'send_to': `${GOOGLE_ADS_ID}/${CALL_CONVERSION_LABEL}`,
      'event_category': 'engagement',
      'event_label': 'phone_call_button_click',
    });
    
    console.log('✅ Call conversion tracked');
  } catch (error) {
    console.error('Failed to track call conversion:', error);
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
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    console.warn('gtag not available - conversion tracking skipped');
    return;
  }

  try {
    window.gtag('event', 'conversion', {
      'send_to': `${GOOGLE_ADS_ID}/${BOOKING_CONVERSION_LABEL}`,
      'value': bookingValue,
      'currency': 'GBP',
      'transaction_id': bookingReference,
    });
    
    console.log('✅ Booking conversion tracked:', {
      value: bookingValue,
      reference: bookingReference,
    });
  } catch (error) {
    console.error('Failed to track booking conversion:', error);
  }
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
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    console.warn('gtag not available - conversion tracking skipped');
    return;
  }

  try {
    // Standard conversion event
    window.gtag('event', 'conversion', {
      'send_to': `${GOOGLE_ADS_ID}/${BOOKING_CONVERSION_LABEL}`,
      'value': bookingValue,
      'currency': 'GBP',
      'transaction_id': bookingReference,
    });

    // Enhanced ecommerce event for GA4
    window.gtag('event', 'purchase', {
      'transaction_id': bookingReference,
      'value': bookingValue,
      'currency': 'GBP',
      'items': [
        {
          'item_id': 'moving_service',
          'item_name': 'Man and Van Service',
          'item_category': serviceTier,
          'price': bookingValue,
          'quantity': 1,
        }
      ]
    });
    
    console.log('✅ Enhanced booking conversion tracked');
  } catch (error) {
    console.error('Failed to track enhanced booking conversion:', error);
  }
};
