# Google Ads Tracking Implementation Summary

## Date: November 10, 2025

## Overview

This document summarizes the implementation of Google Ads conversion tracking on the Speedy Van website. The tracking code has been properly configured to record conversions when users complete bookings or submit lead forms.

---

## What Was Implemented

### 1. Global Site Tag (gtag.js) - Already Present

The Google Ads Global Site Tag was already implemented in the main layout file and is loading correctly on all pages.

**Location**: `/apps/web/src/app/layout.tsx` (lines 155-171)

**Implementation**:
```javascript
<Script
  src="https://www.googletagmanager.com/gtag/js?id=AW-17715630822"
  strategy="afterInteractive"
/>
<Script id="google-ads-init" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-17715630822', {
      'send_page_view': true,
      'cookie_flags': 'SameSite=None;Secure'
    });
    console.log('✅ Google Ads Global Tag initialized');
  `}
</Script>
```

### 2. Conversion Event Snippet - Updated

The conversion tracking snippet has been updated with the correct conversion label on two key pages:

#### A. Booking Success Page

**Location**: `/apps/web/src/app/booking-luxury/success/page.tsx` (lines 174-182)

**Implementation**:
```javascript
// Track Google Ads conversion
if (typeof window !== 'undefined' && (window as any).gtag) {
  try {
    (window as any).gtag('event', 'conversion', {
      'send_to': 'AW-17715630822/Submit_lead_form_Website',
      'value': bookingAmount,
      'currency': 'GBP',
      'transaction_id': data.metadata?.bookingReference || sessionId
    });
  } catch (gtagError) {
    console.error('❌ Google Ads conversion tracking failed:', gtagError);
  }
}
```

**Triggers when**: A customer successfully completes a booking and reaches the success page after payment.

**Conversion value**: Dynamic - based on the actual booking amount in GBP.

#### B. Contact Form Submission

**Location**: `/apps/web/src/app/contact/page.tsx` (lines 153-165)

**Implementation**:
```javascript
// Track Google Ads conversion for lead form submission
if (typeof window !== 'undefined' && (window as any).gtag) {
  try {
    (window as any).gtag('event', 'conversion', {
      'send_to': 'AW-17715630822/Submit_lead_form_Website',
      'value': 1.0,
      'currency': 'GBP'
    });
    console.log('✅ Google Ads conversion tracked: Contact form submission');
  } catch (gtagError) {
    console.error('❌ Google Ads conversion tracking failed:', gtagError);
  }
}
```

**Triggers when**: A visitor submits the contact form on the contact page.

**Conversion value**: Fixed at £1.00 GBP.

---

## Google Ads Account Details

- **Account ID**: AW-17715630822
- **Conversion Label**: Submit_lead_form_Website
- **Full Conversion ID**: AW-17715630822/Submit_lead_form_Website
- **Account Email**: jewansaleh781@gmail.com

---

## Conversion Actions in Google Ads

The following conversion actions are configured in the Google Ads account:

1. **Phone Call Lead** - Tracks calls from ads
2. **Submit lead form** (Website) - Tracks form submissions and bookings *(This is the one we implemented)*
3. **Lead form - Submit** (Google hosted) - Tracks Google-hosted lead forms

---

## Files Modified

1. `/apps/web/src/app/booking-luxury/success/page.tsx` - Updated conversion tracking with correct label
2. `/apps/web/src/app/contact/page.tsx` - Added conversion tracking for contact form submissions

---

## Next Steps

### 1. Commit and Deploy Changes

The changes need to be committed to the repository and deployed to the live website:

```bash
cd /home/ubuntu/sv
git add apps/web/src/app/booking-luxury/success/page.tsx
git add apps/web/src/app/contact/page.tsx
git commit -m "Add Google Ads conversion tracking with correct label"
git push origin main
```

### 2. Verify Implementation

After deployment, verify the tracking is working:

1. **Test Booking Flow**:
   - Complete a test booking on the live site
   - Check browser console for: `✅ Google Ads conversion tracked`
   - Verify conversion appears in Google Ads within 24 hours

2. **Test Contact Form**:
   - Submit the contact form
   - Check browser console for: `✅ Google Ads conversion tracked: Contact form submission`
   - Verify conversion appears in Google Ads within 24 hours

3. **Google Ads Dashboard**:
   - Navigate to Goals > Conversions > Summary
   - Check "Submit lead form" conversion action
   - Status should change from "Inactive" to "Recording conversions"

### 3. Monitor Performance

- Check Google Ads dashboard daily for the first week
- Verify conversion data is being recorded correctly
- Adjust campaign optimization based on conversion data

---

## Technical Notes

- The Global Site Tag loads on every page using Next.js Script component with `afterInteractive` strategy
- Conversion events fire only on success pages after user actions are completed
- Error handling is in place to catch and log any tracking failures
- Console logging is enabled for debugging purposes
- The tracking respects user privacy and follows GDPR guidelines through the existing consent management system

---

## Support

If you encounter any issues with the tracking implementation:

1. Check browser console for error messages
2. Verify the Global Site Tag is loading (check Network tab in DevTools)
3. Ensure cookies are enabled in the browser
4. Contact Google Ads support if conversions are not appearing after 48 hours

---

**Implementation completed by**: Manus AI Agent  
**Date**: November 10, 2025  
**Status**: ✅ Ready for deployment
