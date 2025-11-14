# Google Ads Conversion Tracking Fix - Documentation

## Date: November 14, 2025

## Problem Summary

The Google Ads campaign was configured with "Maximize Conversions" bidding strategy but had **zero impressions and zero clicks** due to critical conversion tracking issues:

1. **Inactive Conversion Tracking**: Conversion actions showed as "Inactive" with no recent conversions
2. **Missing Tracking Code**: The main booking success page (`/booking/success`) had no conversion tracking code
3. **URL Mismatch**: Google Ads was configured to track conversions on `speedy-van.co.uk/success` but the actual success page is `/booking/success`
4. **Learning Freeze**: Without conversion data, Google's algorithm couldn't optimize the campaign, resulting in zero ad impressions

## Solution Implemented

### 1. Added Conversion Tracking to Booking Success Page

**File Modified:** `/apps/web/src/app/booking/success/page.tsx`

**Changes Made:**
- Added Google Ads conversion tracking code to the `fetchBooking` function
- Conversion fires when booking details are successfully fetched
- Tracks the actual booking value and transaction ID for accurate reporting

**Code Added:**
```javascript
// Track Google Ads conversion for successful booking
if (typeof window !== 'undefined' && (window as any).gtag) {
  try {
    (window as any).gtag('event', 'conversion', {
      'send_to': 'AW-17715630822/Submit_lead_form_Website',
      'value': data.booking.total || 1.0,
      'currency': 'GBP',
      'transaction_id': data.booking.bookingNumber || bookingId
    });
    console.log('✅ Google Ads conversion tracked: Booking completed', {
      bookingId,
      value: data.booking.total
    });
  } catch (gtagError) {
    console.error('❌ Google Ads conversion tracking failed:', gtagError);
  }
}
```

### 2. Conversion Tracking Details

| Parameter | Value | Description |
| :--- | :--- | :--- |
| Conversion ID | `AW-17715630822/Submit_lead_form_Website` | Google Ads conversion identifier |
| Value | `data.booking.total` or `1.0` | Actual booking value in GBP |
| Currency | `GBP` | British Pounds |
| Transaction ID | `bookingNumber` or `bookingId` | Unique identifier to prevent duplicate conversions |

## Next Steps Required in Google Ads Dashboard

### 1. Update Conversion Action Settings

Navigate to: **Google Ads > Goals > Conversions > Submit lead form**

Update the following:
- **Event trigger**: Change from "Page load: speedy-van.co.uk/success" to **"Event-based tracking"**
- **Conversion name**: Keep as "Submit lead form" or rename to "Booking Completed"
- **Value**: Set to "Use different values for each conversion" (already tracking actual booking value)
- **Count**: Keep as "One" (one conversion per booking)

### 2. Verify Conversion Tracking

1. Make a test booking on the website
2. Complete the payment process
3. Check Google Ads > Goals > Conversions for the conversion event
4. Allow 24-48 hours for conversions to appear in reports

### 3. Adjust Bidding Strategy (Recommended)

**Current Strategy:** Maximize Conversions

**Recommended Temporary Change:**
- Switch to **"Maximize Clicks"** for 7-14 days
- This allows the campaign to gather initial data and impressions
- Once 10-15 conversions are recorded, switch back to "Maximize Conversions"

**Why?**
- "Maximize Conversions" requires conversion data to work effectively
- Starting with "Maximize Clicks" helps build initial traffic and conversion history
- After sufficient data is collected, the algorithm can optimize for conversions

### 4. Keyword Optimization (Critical)

**Current Issues:**
- All keywords use "Broad Match" (least targeted)
- Several keywords marked "Low search volume"
- Low Quality Scores

**Recommended Actions:**
1. Remove keywords with "Low search volume" status
2. Change match type from "Broad Match" to:
   - **Phrase Match** for moderate targeting
   - **Exact Match** for high-precision targeting
3. Group keywords into specific ad groups by service type:
   - House Moving
   - Furniture Delivery
   - Office Relocation
   - Student Moving

**Example Keyword Structure:**

| Keyword | Current Match Type | Recommended Match Type | Ad Group |
| :--- | :--- | :--- | :--- |
| man and van london | Broad | Phrase | Man and Van Services |
| furniture removal london | Broad | Phrase | Furniture Services |
| office removals | Broad | Phrase | Office Services |
| student moving service | Broad | Exact | Student Services |

## Testing Checklist

- [x] Conversion tracking code added to `/booking/success` page
- [ ] Test booking completed to verify conversion fires
- [ ] Conversion appears in Google Ads dashboard (24-48 hour delay)
- [ ] Google Ads conversion settings updated
- [ ] Bidding strategy adjusted (if needed)
- [ ] Keywords optimized and reorganized
- [ ] Campaign monitoring alerts set up

## Monitoring & Alerts

Set up the following alerts in Google Ads:

1. **Zero Impressions Alert**: Notify if impressions drop to zero for 24 hours
2. **Conversion Tracking Alert**: Notify if no conversions recorded for 7 days
3. **Budget Alert**: Notify when 80% of daily budget is spent
4. **Quality Score Alert**: Notify if average Quality Score drops below 5

## Expected Results

**Within 24-48 hours:**
- Conversion tracking should show as "Active"
- First conversions should appear in reports

**Within 7 days:**
- Campaign should start showing impressions and clicks
- Initial conversion data collected

**Within 14-30 days:**
- Sufficient data for "Maximize Conversions" strategy
- Improved Quality Scores from keyword optimization
- Stable conversion rate established

## Contact & Support

For questions or issues with this implementation:
- Review this documentation
- Check Google Ads Help Center for conversion tracking
- Test conversions using Google Tag Assistant Chrome extension

---

**Implementation Date:** November 14, 2025  
**Implemented By:** Manus AI  
**Status:** ✅ Code changes completed, awaiting deployment and Google Ads configuration
