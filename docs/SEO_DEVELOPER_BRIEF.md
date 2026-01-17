# SEO Improvement Brief - Speedy Van vs AnyVan Competition

**Date:** January 17, 2026  
**Prepared for:** Development Team  
**Priority:** HIGH - Brand Visibility Issue

---

## 🚨 The Problem

When users search for **"speedy van"** (our own brand name), **AnyVan.com appears in top results instead of us**. This is a critical brand authority issue that needs immediate attention.

---

## ✅ Current Infrastructure Audit

### What We Have (Excellent Foundation):

1. **787 location pages** in `places.json`
   - All UK cities, towns, and villages covered
   - Dynamic routing: `/uk/[place]`, `/uk/[...slug]`, `/uk/regions/[region]`
   
2. **Metadata optimization** ✅
   - Title tags, descriptions, keywords present on all pages
   - Open Graph and Twitter Card metadata implemented
   
3. **Schema.org markup** ✅
   - JSON-LD structured data
   - LocalBusiness, Service, FAQ schemas present
   - Breadcrumb navigation implemented
   
4. **Service pages** ✅
   - Man and van, furniture removal, house removals, etc.
   - Each service has dedicated landing page
   
5. **~1100 URLs in sitemap** ✅
   - Good indexation coverage

---

## ❌ Critical Gaps vs AnyVan

### 1. **Dynamic Social Proof** (Missing)

**AnyVan has:**
- "Recent Moves" widget showing live activity
- "John moved from London to Manchester - 2 hours ago - 5★"
- Updates every few minutes
- Creates trust and urgency

**We have:**
- Static content only
- Hardcoded stats: "500+ Moves", "4.9 Rating"
- No real-time activity indicators

**Question for Developer:**
> Do we have a `bookings` table in the database with completed moves? Can we query recent bookings (anonymized) to display on pages?

---

### 2. **Review System** (Critical Gap)

**AnyVan has:**
- 180,000+ Trustpilot reviews
- Displayed prominently on every page
- Review schema in search results

**We have:**
- 2 Trustpilot reviews (essentially none)
- Stats are hardcoded (not from real data)

**Questions for Developer:**
1. Do we have a `reviews` or `ratings` table in the database?
2. Are we currently collecting reviews from customers after completed bookings?
3. Do we have Google Business Profile set up for reviews?
4. Can we implement an automated review request system (email/SMS after booking completion)?

---

### 3. **Content Depth on Location Pages**

**AnyVan has:**
- 2000-3000 words per major city page
- Detailed area guides, parking info, local tips
- 20+ FAQs per location
- Dynamic "Recent moves in [City]" sections

**We have:**
- Good page structure and design
- But content is relatively thin (300-500 words)
- Generic content across locations (not city-specific)

**Example:** `/uk/london/page.tsx` is 814 lines but mostly React components, limited SEO text content

**Questions for Developer:**
1. Can we add more text content to location pages without breaking the design?
2. Should we create a CMS or content database for city-specific information?
3. Can we generate dynamic FAQ sections per location?

---

### 4. **Stats & Metrics** (Credibility Issue)

**Current implementation in `/uk/[place]/page.tsx`:**

```tsx
function PlaceStats({ place }: { place: any }) {
  return (
    <div className="place-stats">
      <div className="stat-card">
        <div className="stat-number">500+</div>
        <div className="stat-label">Moves in {place.name}</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">4.9</div>
        <div className="stat-label">Customer Rating</div>
      </div>
      // ... hardcoded values
    </div>
  );
}
```

**Questions for Developer:**
1. **Are these stats real or placeholder?**
2. Can we query actual booking counts per location from the database?
3. Can we calculate real average ratings from customer feedback?
4. Should we display real metrics or keep them generic?

---

### 5. **Brand Authority Signals**

**Problem:** "Speedy Van" is a descriptive name, not easily recognized as a unique brand by Google.

**Questions for Developer:**
1. Do we have social media profiles set up (Facebook, Twitter, LinkedIn)?
2. Is our Google Business Profile claimed and optimized?
3. Do we have any press mentions or partnerships we can reference?
4. Can we add more brand signals to the Organization schema?

---

## 🎯 Proposed Implementation Plan

### Phase 1: Dynamic Social Proof (Quick Win - 2-3 days)

**Deliverables:**
1. **Recent Bookings Widget Component**
   - Query last 20 bookings from database
   - Anonymize customer names (John S. instead of John Smith)
   - Extract city names from addresses
   - Display in rotating widget
   - Add to homepage and top location pages

2. **Real Stats Integration**
   - Replace hardcoded numbers with database queries
   - Count completed bookings per location
   - Calculate average ratings (if we have them)
   - Cache results for performance

**Technical Questions:**
- What's the bookings table schema? (`Booking` model in Prisma?)
- Fields needed: `customerName`, `pickupAddress`, `deliveryAddress`, `status`, `rating`, `completedAt`
- Do we have these fields? What are they called?

---

### Phase 2: Review Collection System (1 week)

**Deliverables:**
1. **Automated Review Requests**
   - Trigger email 2 hours after booking completion
   - Include Google Review link
   - Optional: SMS reminder after 24 hours
   - Optional: 10% discount incentive for reviewers

2. **Review Display System**
   - Fetch reviews from Google API (if available)
   - Display on relevant pages
   - Add Review schema markup
   - Show star ratings in search results

**Technical Questions:**
1. Do we have email service configured (SendGrid, Resend, AWS SES)?
2. Do we have SMS service for reminders?
3. Google Business Profile API access - do we have it?
4. Should we build our own review database or rely on Google Reviews?

---

### Phase 3: Content Enhancement (2-3 weeks)

**Deliverables:**
1. **Enhanced Location Pages**
   - Add 1500+ words of unique content per major city (top 20)
   - City-specific FAQs (15-20 questions)
   - Local moving tips, parking regulations, etc.
   - "Recent Moves in [City]" section

2. **FAQ Schema Implementation**
   - Generate dynamic FAQs per location
   - Add FAQ schema to all service pages

**Technical Questions:**
1. Should we store enhanced content in database or static files?
2. Can we use AI to generate initial city-specific content (to be reviewed by team)?
3. Do we need a CMS for content management?

---

### Phase 4: Schema & Technical SEO (3-5 days)

**Deliverables:**
1. **Enhanced Schema Markup**
   - Add Review schema with real reviews
   - Strengthen Organization schema with brand signals
   - Add AggregateRating to all pages (from real data)

2. **Performance Optimization**
   - Core Web Vitals check and fixes
   - Image optimization (WebP conversion)
   - Code splitting if needed

**Technical Questions:**
1. Current PageSpeed Insights score?
2. Any known performance issues?
3. Are images already optimized?

---

## 🔍 Critical Questions for Developer (Please Answer Before We Start)

### Database & Data Access:

1. **Bookings Table:**
   - [ ] Do we have a `Booking` or `Order` table?
   - [ ] What fields does it have? (especially: customer info, addresses, status, rating, dates)
   - [ ] Can you share the Prisma schema for the booking model?
   - [ ] How many completed bookings do we have in total?
   - [ ] Are bookings associated with specific locations/cities?

2. **Reviews/Ratings:**
   - [ ] Do we currently collect ratings/reviews from customers?
   - [ ] Is there a `Review` or `Rating` table?
   - [ ] If yes, how many reviews do we have?
   - [ ] If no, should we create this table?

3. **Statistics:**
   - [ ] Are the stats on location pages (500+ moves, 4.9 rating) real or placeholders?
   - [ ] Can we query actual booking counts per city?
   - [ ] Do we track average ratings per location?

### Integration & Services:

4. **Email Service:**
   - [ ] What email service are we using? (SendGrid, Resend, etc.)
   - [ ] Is it configured and ready to use?
   - [ ] Can we send automated emails after booking completion?

5. **SMS Service:**
   - [ ] Do we have SMS capability? (Twilio, etc.)
   - [ ] If yes, is it configured?

6. **Google Services:**
   - [ ] Is Google Business Profile set up?
   - [ ] Do we have Google Reviews enabled?
   - [ ] Do we have Google Analytics/Search Console access?
   - [ ] Any API keys for Google Places/Reviews?

### Content & SEO:

7. **Current Performance:**
   - [ ] What's our Google PageSpeed Insights score?
   - [ ] What's our current Google ranking for "speedy van" (brand search)?
   - [ ] What's our current organic traffic per month?
   - [ ] Do we have Google Search Console data?

8. **Content Management:**
   - [ ] How should we manage city-specific content? (Database, CMS, static files?)
   - [ ] Can we use AI-generated content (reviewed by team) to speed up city pages?
   - [ ] Who will review/approve content before going live?

### Timeline & Resources:

9. **Development Availability:**
   - [ ] How many developer hours per week can be allocated to this?
   - [ ] Any blockers or dependencies we should know about?
   - [ ] Preferred implementation approach? (Feature branches, etc.)

10. **Priority Order:**
    - [ ] Which phase should we tackle first? (My recommendation: Phase 1 - Quick Win)
    - [ ] Any existing work in progress that conflicts with this?

---

## 📊 Success Metrics (6 Months)

If we implement all phases:

- **Brand Search:** Rank #1 for "speedy van" (currently not top 3)
- **Reviews:** 500+ Google Reviews (currently ~0)
- **Organic Traffic:** +150% increase
- **Top 10 Rankings:** 100+ keywords in top 10
- **Conversion Rate:** 5%+ from organic traffic

---

## 🚀 Recommended Starting Point

**My Recommendation: Start with Phase 1 - Dynamic Social Proof**

**Why?**
- Quick to implement (2-3 days)
- Immediate visual impact
- Low risk, high reward
- Requires minimal external dependencies
- Provides real credibility boost

**What we need from you:**
1. Confirm bookings table structure
2. Confirm we have completed bookings to display
3. Green light to create the Recent Bookings API endpoint
4. Permission to add the widget to homepage and location pages

---

## 📝 Next Steps

**Please review this brief and answer the questions above.** 

Once we have answers, we can:
1. Prioritize the phases
2. Create detailed technical specs for Phase 1
3. Set up development branches
4. Begin implementation

**Questions? Concerns? Alternative approaches?** Please share your thoughts.

---

**Prepared by:** GitHub Copilot  
**For:** Speedy Van Development Team  
**Status:** Awaiting Developer Feedback
