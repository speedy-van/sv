# Google Ads Fix Implementation Guide
## Speedy Van - Complete Campaign Repair

**Date:** November 13, 2025  
**Status:** READY TO IMPLEMENT  
**Estimated Time:** 2-4 hours  
**Expected Impact:** Transform from £100+ spend with 0 bookings to positive ROI within 7 days

---

## EXECUTIVE SUMMARY

This guide provides step-by-step instructions to fix all critical issues identified in the Google Ads audit:

| Issue | Status | Fix Files Ready |
|-------|--------|-----------------|
| Invalid Keywords (317 keywords) | 🔴 CRITICAL | ✅ `keywords_corrected.csv` |
| No Ads (1,230 ad groups) | 🔴 CRITICAL | ✅ `ads_template.csv` |
| Conversion Tracking Inactive | 🔴 CRITICAL | ⏳ Manual setup required |
| Optimization Score 10% | 🔴 CRITICAL | ✅ Will fix automatically after above |

---

## PREREQUISITES

Before starting, ensure you have:
- [x] Access to Google Ads account (604-367-9390)
- [x] Admin or Editor permissions
- [x] Access to website for conversion tracking tag installation
- [x] Downloaded fix files:
  - `keywords_corrected.csv` (1,230 corrected keywords)
  - `ads_template.csv` (1,230 responsive search ads)
  - `invalid_keywords_full_report.txt` (audit reference)

---

## PHASE 1: PAUSE CAMPAIGN (IMMEDIATE - 5 MINUTES)

### Why: Stop wasting budget on non-functional campaigns

### Steps:
1. Go to Google Ads → Campaigns
2. Find "Man With A Van - Exact Match"
3. Click the toggle to **PAUSE** the campaign
4. Confirm the campaign status shows "Paused"

**⚠️ CRITICAL:** Do not proceed to Phase 2 until campaign is paused!

---

## PHASE 2: DELETE INVALID KEYWORDS (30 MINUTES)

### Why: Remove all 317 keywords that exceed 35-character limit

### Option A: Bulk Delete via Google Ads Editor (RECOMMENDED)
1. Download and install [Google Ads Editor](https://ads.google.com/home/tools/ads-editor/)
2. Open Google Ads Editor
3. Click "Get recent changes" to sync account
4. Navigate to: Keywords → Search Keywords
5. Filter by Campaign: "Man With A Van - Exact Match"
6. Select all keywords (Ctrl+A / Cmd+A)
7. Click "Delete" button
8. Click "Post changes" to upload deletions
9. Wait for sync to complete

### Option B: Manual Delete via Web Interface (SLOWER)
1. Go to Google Ads → Keywords
2. Remove all filters to see all keywords
3. Select all keywords on page (checkbox at top)
4. Click "Edit" → "Remove"
5. Repeat for all pages until all keywords deleted
6. Confirm "0 keywords" in the campaign

**✅ Verification:** Confirm keyword count = 0 before proceeding

---

## PHASE 3: UPLOAD CORRECTED KEYWORDS (30 MINUTES)

### Why: Add all 1,230 valid keywords with correct pattern

### Steps:

1. **Prepare the CSV file**
   - File location: `/home/ubuntu/sv-project/keywords_corrected.csv`
   - Download this file to your computer

2. **Upload via Google Ads Editor (RECOMMENDED)**
   - Open Google Ads Editor
   - Go to: Account → Import → From file
   - Select `keywords_corrected.csv`
   - Review import preview
   - Click "Finish and review changes"
   - Click "Post changes"
   - Wait for sync (may take 5-10 minutes)

3. **Alternative: Upload via Web Interface**
   - Go to Google Ads → Keywords
   - Click the "+" button
   - Select "Upload keywords"
   - Choose `keywords_corrected.csv`
   - Map columns correctly:
     - Campaign → Campaign
     - Ad Group → Ad Group
     - Keyword → Keyword
     - Match Type → Match Type
   - Click "Upload"
   - Wait for processing

**✅ Verification:** 
- Confirm 1,230 keywords uploaded
- Check sample keywords are under 35 characters
- Verify no "Invalid keyword" errors

---

## PHASE 4: CREATE RESPONSIVE SEARCH ADS (45 MINUTES)

### Why: Add ads to all 1,230 ad groups so campaigns can serve

### Steps:

1. **Prepare the CSV file**
   - File location: `/home/ubuntu/sv-project/ads_template.csv`
   - Download this file to your computer

2. **Upload via Google Ads Editor (RECOMMENDED)**
   - Open Google Ads Editor
   - Go to: Account → Import → From file
   - Select `ads_template.csv`
   - Review import preview
   - Verify headlines and descriptions look correct
   - Click "Finish and review changes"
   - Click "Post changes"
   - Wait for sync (may take 10-15 minutes for 1,230 ads)

3. **Alternative: Create One Template Ad (FASTER)**
   - Go to Google Ads → Ads
   - Click "+" button → "Responsive search ad"
   - Select Campaign: "Man With A Van - Exact Match"
   - Select Ad Group: Any (e.g., "Aberavon - Man With Van")
   - Enter headlines:
     ```
     H1: Man & Van {KeyWord:Your City}
     H2: Same Day Service Available
     H3: From £25 | Fully Insured
     H4: Book Online in 2 Minutes
     H5: 5-Star Rated Service
     H6: Professional & Reliable
     H7: Trusted Local Service
     H8: Instant Online Booking
     H9: All Vans Fully Tracked
     H10: Furniture & House Moves
     ```
   - Enter descriptions:
     ```
     D1: Need a man and van in {KeyWord:your area}? Book online instantly. Fully insured, professional service.
     D2: Trusted by 1000s of customers. Furniture delivery, house moves, eBay collections. All vans tracked.
     D3: Same-day availability. Get instant quote online. From £25. Professional drivers. 5-star rated.
     D4: Professional drivers. Fully insured. Book now for today or tomorrow. Available 7 days a week.
     ```
   - Final URL: `https://speedy-van.co.uk/man-and-van-{city-slug}`
   - Click "Save"
   - **Copy ad to all other ad groups:**
     - Select the ad
     - Click "Copy"
     - Select all ad groups
     - Click "Paste"

**✅ Verification:**
- Confirm 1,230 ads created (1 per ad group)
- Check ad strength is "Good" or "Excellent"
- Verify no policy violations

---

## PHASE 5: SETUP CONVERSION TRACKING (30 MINUTES)

### Why: Track bookings and optimize for conversions

### Steps:

1. **Create Conversion Action**
   - Go to Google Ads → Tools → Conversions
   - Click "+" button → "Website"
   - Select "Booking" or "Purchase"
   - Name: "Booking Completed"
   - Value: Use transaction-specific value
   - Count: One
   - Click "Create and continue"

2. **Install Conversion Tag**
   - Copy the conversion tracking code
   - Add to website's booking confirmation page
   - Place code in `<head>` section before `</head>`
   - **Location:** After successful booking submission

3. **Test the Tag**
   - Go to Google Tag Assistant (Chrome extension)
   - Visit your website
   - Complete a test booking
   - Verify tag fires on confirmation page
   - Check Google Ads for "Unverified conversion" (within 24 hours)

4. **Alternative: Import from Google Analytics**
   - If you have Google Analytics with Goals set up
   - Go to Tools → Conversions → Import
   - Select Google Analytics
   - Import "Booking" or "Purchase" goal
   - Link accounts if needed

**✅ Verification:**
- Tag shows "Active" status in Google Ads
- Test conversion recorded within 24 hours
- Conversion tracking status = "Recording conversions"

---

## PHASE 6: ENABLE CAMPAIGN & MONITOR (15 MINUTES)

### Why: Launch the fixed campaign and ensure it's working

### Steps:

1. **Final Pre-Launch Checklist**
   - [ ] Campaign is paused
   - [ ] 1,230 keywords uploaded and valid
   - [ ] 1,230 ads created and approved
   - [ ] Conversion tracking installed and tested
   - [ ] Budget set to reasonable amount (£50-100/day to start)
   - [ ] Bid strategy appropriate (Manual CPC or Maximize Conversions)

2. **Enable Campaign**
   - Go to Google Ads → Campaigns
   - Find "Man With A Van - Exact Match"
   - Click toggle to **ENABLE** campaign
   - Confirm status shows "Eligible"

3. **Monitor First 24 Hours**
   - Check impressions are being generated
   - Verify clicks are coming in
   - Monitor search terms report
   - Check for any disapproved ads
   - Add negative keywords if needed

**✅ Verification:**
- Impressions > 0 within 1 hour
- Clicks > 0 within 2-4 hours
- No critical errors or warnings
- Campaign status = "Eligible"

---

## PHASE 7: OPTIMIZATION (ONGOING - DAILY FOR FIRST WEEK)

### Daily Tasks (First 7 Days)

**Day 1-2: Monitor Launch**
- Check impressions, clicks, CTR every 2-4 hours
- Verify ads are showing correctly
- Add negative keywords from search terms report
- Adjust bids if needed

**Day 3-5: Initial Optimization**
- Review search terms report daily
- Add 20-50 negative keywords
- Pause low-performing ad groups (if any)
- Increase bids on high-performing keywords
- Check conversion data (should start appearing)

**Day 6-7: Performance Analysis**
- Calculate cost per conversion
- Identify best-performing cities
- Adjust budget allocation
- Test new ad copy variations
- Plan for scaling

### Weekly Tasks (Week 2+)

- Review performance by city
- Adjust bids based on conversion data
- Test new ad copy
- Expand to new cities if ROI positive
- Consider adding broad match campaign
- Test Performance Max campaign

---

## EXPECTED RESULTS

### Before Fixes
- **Impressions:** 0 (no ads)
- **Clicks:** 0 (no ads)
- **Conversions:** 0
- **Cost:** £100+ wasted
- **ROI:** Negative 100%

### After Fixes (Week 1)
- **Impressions:** 10,000-50,000 per week
- **Clicks:** 200-1,000 per week (2-5% CTR)
- **Conversions:** 5-30 per week (2-3% conversion rate)
- **Cost per conversion:** £10-30
- **ROI:** Break-even to +50%

### After Optimization (Month 1)
- **Impressions:** 50,000-200,000 per month
- **Clicks:** 1,000-5,000 per month
- **Conversions:** 30-150 per month
- **Cost per conversion:** £8-20
- **ROI:** +100% to +300%

---

## TROUBLESHOOTING

### Issue: Keywords Not Uploading
**Solution:**
- Check CSV format matches Google Ads template
- Ensure no special characters in keywords
- Verify campaign and ad group names match exactly
- Try uploading in smaller batches (100-200 at a time)

### Issue: Ads Not Showing
**Solution:**
- Check campaign is enabled
- Verify budget is not exhausted
- Confirm ads are approved (not pending review)
- Check bid amounts are competitive
- Verify keywords have search volume

### Issue: No Conversions After 7 Days
**Solution:**
- Verify conversion tag is firing (Google Tag Assistant)
- Check landing pages are working correctly
- Ensure booking process is functional
- Review conversion attribution settings
- Check if conversions are being recorded but not attributed

### Issue: High Cost, Low Conversions
**Solution:**
- Add more negative keywords
- Pause low-performing cities
- Improve landing page experience
- Test different ad copy
- Adjust bids downward
- Focus budget on best-performing areas

---

## ROLLBACK PLAN

If fixes cause unexpected issues:

1. **Immediate Rollback**
   - Pause campaign immediately
   - Do not delete keywords or ads yet
   - Review error messages

2. **Partial Rollback**
   - Keep new keywords
   - Revert to old ad copy (if you saved it)
   - Adjust bids back to original

3. **Full Rollback**
   - Export current setup first
   - Delete new keywords
   - Delete new ads
   - Restore from backup (if available)

**⚠️ Note:** There is no backup of the original broken setup, so rollback would mean starting from scratch.

---

## SUCCESS METRICS

Track these KPIs to measure success:

| Metric | Target (Week 1) | Target (Month 1) |
|--------|----------------|------------------|
| Impressions | 10,000+ | 50,000+ |
| CTR | 2-5% | 3-6% |
| Clicks | 200+ | 1,000+ |
| Conversion Rate | 1-3% | 2-4% |
| Conversions | 5+ | 30+ |
| Cost per Conversion | £20-40 | £10-25 |
| ROI | Break-even | +100%+ |
| Optimization Score | 50%+ | 70%+ |

---

## NEXT STEPS AFTER FIXES

Once the campaign is stable and profitable:

1. **Scale Successful Cities**
   - Identify top 20% performing cities
   - Increase budget allocation
   - Create dedicated campaigns for top cities

2. **Add New Campaign Types**
   - Broad match campaign for discovery
   - Performance Max for automation
   - Display remarketing for brand awareness

3. **Expand Keyword Coverage**
   - Add phrase match keywords
   - Test broad match modified
   - Add service-specific keywords (furniture delivery, house moves, etc.)

4. **Improve Quality Score**
   - Optimize landing pages
   - Improve ad relevance
   - Increase CTR through better ad copy

5. **Test and Iterate**
   - A/B test ad copy
   - Test different landing pages
   - Experiment with bid strategies
   - Try different ad extensions

---

## SUPPORT & RESOURCES

### Google Ads Help
- [Google Ads Help Center](https://support.google.com/google-ads)
- [Keyword Character Limits](https://support.google.com/google-ads/answer/1704389)
- [Responsive Search Ads Best Practices](https://support.google.com/google-ads/answer/7684791)

### Tools
- [Google Ads Editor](https://ads.google.com/home/tools/ads-editor/)
- [Google Tag Assistant](https://tagassistant.google.com/)
- [Keyword Planner](https://ads.google.com/home/tools/keyword-planner/)

### Contact
For questions or issues during implementation:
- Review the audit report: `google-ads-audit.md`
- Check invalid keywords list: `invalid_keywords_full_report.txt`
- Verify fix files: `keywords_corrected.csv` and `ads_template.csv`

---

## CONCLUSION

This implementation guide provides a complete, step-by-step process to fix all critical issues in the Google Ads account. Following these steps will:

✅ Fix all 317 invalid keywords  
✅ Create 1,230 responsive search ads  
✅ Enable conversion tracking  
✅ Launch a fully functional campaign  
✅ Generate positive ROI within 7-14 days  

**Estimated total time:** 2-4 hours  
**Expected outcome:** Transform from £100+ wasted to profitable campaign  

**Good luck with the implementation!** 🚀

