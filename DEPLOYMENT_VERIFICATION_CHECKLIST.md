# Google Ads Tracking - Deployment Verification Checklist

## ✅ Implementation Status: COMPLETE

**Date**: November 10, 2025  
**Commit**: 20777ce  
**Branch**: main  
**Status**: Pushed to GitHub

---

## What Was Done

### 1. ✅ Retrieved Actual Conversion Label from Google Ads
- Logged into Google Ads account (jewansaleh781@gmail.com)
- Navigated to Goals > Conversions
- Found conversion action: "Submit lead form"
- Retrieved conversion label: **Submit_lead_form_Website**
- Full conversion ID: **AW-17715630822/Submit_lead_form_Website**

### 2. ✅ Verified Global Site Tag (Already Present)
- Location: `/apps/web/src/app/layout.tsx`
- Status: Already implemented and loading correctly
- Loads on all pages with `afterInteractive` strategy

### 3. ✅ Added Conversion Tracking to Booking Success Page
- File: `/apps/web/src/app/booking-luxury/success/page.tsx`
- Line: 174-182
- Triggers: After successful booking payment
- Value: Dynamic (actual booking amount in GBP)
- Transaction ID: Booking reference or session ID

### 4. ✅ Added Conversion Tracking to Contact Form
- File: `/apps/web/src/app/contact/page.tsx`
- Line: 153-165
- Triggers: After contact form submission
- Value: Fixed at £1.00 GBP

### 5. ✅ Committed and Pushed Changes
- Commit message: "URGENT: Add Google Ads conversion tracking with correct label"
- Files modified: 2
- Files added: 1 (documentation)
- Pushed to: origin/main

---

## Verification Steps (To Be Done After Deployment)

### Step 1: Check Live Website Deployment

Wait for the CI/CD pipeline to deploy the changes to production. This typically takes 5-10 minutes depending on your hosting platform (Vercel, Netlify, etc.).

**How to check**:
1. Visit your live website
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for: `✅ Google Ads Global Tag initialized`

### Step 2: Test Booking Flow (High Priority)

**Test Steps**:
1. Go to your live website booking page
2. Complete a test booking (use test payment if available)
3. After payment success, you should land on `/booking-luxury/success`
4. Open browser console (F12)
5. Look for: `✅ Google Ads conversion tracked:`

**Expected Console Output**:
```
✅ Google Ads conversion tracked: {
  value: [booking_amount],
  currency: 'GBP',
  bookingRef: '[booking_reference]',
  transactionId: '[session_id]'
}
```

### Step 3: Test Contact Form (Medium Priority)

**Test Steps**:
1. Go to your live website contact page
2. Fill out and submit the contact form
3. Open browser console (F12)
4. Look for: `✅ Google Ads conversion tracked: Contact form submission`

**Expected Console Output**:
```
✅ Google Ads conversion tracked: Contact form submission
```

### Step 4: Verify in Google Ads Dashboard (24-48 Hours)

**Important**: Conversions may take up to 24-48 hours to appear in Google Ads.

**Steps**:
1. Log into Google Ads: https://ads.google.com
2. Navigate to: **Goals** > **Conversions** > **Summary**
3. Find the "Submit lead form" conversion action
4. Check the status:
   - **Before**: "Inactive" or "No recent conversions"
   - **After**: "Recording conversions"
5. Look for conversion data in the "All conv." column

### Step 5: Verify Conversion Tag Status

**Steps**:
1. In Google Ads, go to: **Goals** > **Conversions**
2. Click on "Submit lead form" conversion action
3. Go to the "Tag setup" section
4. Status should show: **"Tag is active"** (may take 24 hours)

---

## Troubleshooting

### Issue: Console shows no conversion tracking message

**Possible Causes**:
1. Global Site Tag not loaded
2. JavaScript error preventing execution
3. Browser blocking cookies/tracking

**Solution**:
1. Check Network tab for gtag.js script
2. Check Console for any JavaScript errors
3. Try in incognito mode
4. Disable ad blockers

### Issue: Conversion appears in console but not in Google Ads

**Possible Causes**:
1. Conversion data hasn't synced yet (wait 24-48 hours)
2. Ad blocker blocking the request
3. Cookie consent not granted

**Solution**:
1. Wait 24-48 hours for data to appear
2. Test without ad blockers
3. Ensure cookie consent is accepted

### Issue: "Inactive" status in Google Ads

**Possible Causes**:
1. No conversions recorded yet
2. Tag not firing correctly
3. Conversion label mismatch

**Solution**:
1. Complete a test conversion
2. Verify tag is firing in browser console
3. Double-check conversion label matches exactly

---

## Expected Results

### Immediate (After Deployment)
- ✅ Global Site Tag loads on all pages
- ✅ Console logs show conversion tracking on success pages
- ✅ No JavaScript errors in console

### Within 24 Hours
- ✅ Google Ads shows "Tag is active"
- ✅ First conversions appear in dashboard
- ✅ Status changes from "Inactive" to "Recording conversions"

### Within 1 Week
- ✅ Consistent conversion data flowing
- ✅ Campaign optimization based on conversion data
- ✅ Improved ROAS (Return on Ad Spend)

---

## Important Notes

1. **Test Conversions**: Test conversions will appear in Google Ads. You may want to filter them out later.

2. **Conversion Window**: Google Ads has a default 30-day conversion window. Conversions are attributed to clicks within this period.

3. **Attribution Model**: Check your attribution model in Google Ads settings to understand how conversions are credited.

4. **Data Privacy**: The implementation respects GDPR and uses the existing consent management system.

5. **Multiple Conversions**: The same conversion label is used for both bookings and contact forms. You can differentiate them by the conversion value (bookings have higher values).

---

## Next Actions

### Immediate (Today)
- [ ] Wait for deployment to complete
- [ ] Verify Global Site Tag is loading
- [ ] Test booking flow and check console
- [ ] Test contact form and check console

### Within 24 Hours
- [ ] Check Google Ads dashboard for first conversions
- [ ] Verify "Submit lead form" status changed to active
- [ ] Monitor for any errors or issues

### Within 1 Week
- [ ] Review conversion data in Google Ads
- [ ] Optimize campaigns based on conversion data
- [ ] Set up conversion-based bidding strategies
- [ ] Create conversion reports

### Optional Enhancements
- [ ] Set up separate conversion labels for bookings vs. contact forms
- [ ] Implement enhanced e-commerce tracking
- [ ] Set up conversion value rules
- [ ] Create custom conversion goals

---

## Support Contacts

**Google Ads Support**: https://support.google.com/google-ads  
**Implementation Documentation**: See `GOOGLE_ADS_TRACKING_IMPLEMENTATION.md`

---

**Status**: ✅ Ready for verification  
**Last Updated**: November 10, 2025
