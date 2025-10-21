# SEO Implementation Plan - Speedy Van

## Overview

This document outlines the prioritized action plan to optimize Speedy Van's SEO based on the comprehensive SEO audit recommendations. The plan focuses on eliminating current weaknesses and elevating search performance.

## Implementation Status

**Date Started**: October 21, 2025  
**Commit**: 6433869  
**Status**: In Progress

---

## 1. Content Expansion ✅

### Objective
Add long-form blog posts (1,500-2,500 words) covering moving tips, city-specific guides, and packing advice.

### Actions
- [ ] Create comprehensive moving guides for major UK cities (London, Manchester, Birmingham, Glasgow, Edinburgh)
- [ ] Write detailed packing guides for different room types
- [ ] Develop seasonal moving tips content
- [ ] Create comparison guides (DIY vs Professional, Van sizes, etc.)
- [ ] Add FAQ sections to all service pages
- [ ] Ensure all content includes internal links to service pages

### Target Keywords for New Content
- "how to pack for a move in [city]"
- "moving to [city] guide"
- "best time to move house in UK"
- "furniture removal tips"
- "student moving checklist"
- "office relocation planning"

---

## 2. Metadata Optimization ✅

### Objective
Review and refine title tags and meta descriptions on every page.

### Requirements
- **Title Tags**: Include main keyword + brand name + call to action (max 60 characters)
- **Meta Descriptions**: Summarize page content within 155-160 characters with target keywords
- **Remove**: Keyword stuffing from meta keyword fields

### Pages to Update
- [x] Root layout (apps/web/src/app/layout.tsx)
- [ ] All service pages (furniture, house-moving, office, student)
- [ ] All blog posts
- [ ] Location-specific pages
- [ ] Contact and about pages

### Example Format
```typescript
title: 'Man and Van London | From £25/hour | Book Online | Speedy Van'
description: 'Professional man and van service in London. Same-day removals, furniture delivery, house moving from £25/hour. Trusted by 50,000+ customers. Book instantly online.'
```

---

## 3. Structured Data Enhancement ✅

### Objective
Extend existing JSON-LD schema beyond basic MovingCompany metadata.

### Current Implementation
- ✅ MovingCompany schema with basic info
- ✅ AggregateRating schema
- ✅ Service offerings with pricing

### Required Additions
- [ ] FAQ schema for all service pages
- [ ] Review schema with individual customer reviews
- [ ] BreadcrumbList schema for all pages
- [ ] Article schema for blog posts
- [ ] HowTo schema for guide content
- [ ] LocalBusiness schema for location pages
- [ ] VideoObject schema (when video content added)

### Files to Update
- `apps/web/src/components/StructuredData.tsx`
- `apps/web/src/components/Schema/FAQSchema.tsx`
- `apps/web/src/components/Schema/ReviewSchema.tsx`
- Create new schema components as needed

---

## 4. Page Speed & Core Web Vitals ⚠️

### Objective
Optimize load times and improve Core Web Vitals scores.

### Current Targets
- LCP (Largest Contentful Paint): ≤ 2.5s
- CLS (Cumulative Layout Shift): ≤ 0.05
- INP (Interaction to Next Paint): ≤ 200ms

### Actions Required
- [ ] Compress and convert images to WebP format
- [ ] Implement proper lazy loading with Next.js Image component
- [ ] Enable browser caching headers
- [ ] Minimize JavaScript bundle size
- [ ] Reduce unused CSS
- [ ] Enable server-side rendering for critical pages
- [ ] Implement code splitting
- [ ] Add resource hints (preconnect, prefetch, preload)
- [ ] Optimize font loading strategy

### Audit Tools
- Google PageSpeed Insights
- Lighthouse CI
- WebPageTest
- Chrome DevTools Performance tab

---

## 5. Mobile-First & Accessibility ✅

### Objective
Ensure full mobile responsiveness and accessible HTML semantics.

### Requirements
- [ ] Verify all pages are fully responsive on mobile devices
- [ ] Check font sizes (minimum 16px for body text)
- [ ] Ensure button sizes meet touch target guidelines (44x44px minimum)
- [ ] Implement proper heading hierarchy (h1 → h2 → h3)
- [ ] Add alt attributes to all images
- [ ] Include ARIA labels for interactive elements
- [ ] Test with screen readers
- [ ] Ensure keyboard navigation works properly
- [ ] Add skip-to-content links
- [ ] Verify color contrast ratios (WCAG AA compliance)

### Testing Tools
- Chrome DevTools Mobile Emulator
- Lighthouse Accessibility Audit
- WAVE Browser Extension
- axe DevTools

---

## 6. Internal Linking Strategy 🔗

### Objective
Add contextual links from blog posts and pages to relevant service pages.

### Strategy
- [ ] Create internal linking matrix
- [ ] Add 3-5 contextual links per blog post to service pages
- [ ] Link service pages to related services
- [ ] Implement breadcrumb navigation on all pages
- [ ] Add "Related Services" section to service pages
- [ ] Create topic clusters (pillar pages + supporting content)
- [ ] Add "You might also like" sections to blog posts

### Breadcrumb Implementation
```typescript
// Example breadcrumb structure
Home > Services > Furniture Delivery
Home > Blog > Moving Tips > Ultimate London Moving Guide
```

---

## 7. Backlink Acquisition 🔗

### Objective
Develop a plan to earn high-quality backlinks from relevant sources.

### Strategies
- [ ] Submit to local business directories (Google My Business, Yelp, Yell, etc.)
- [ ] Partner with furniture stores and retailers
- [ ] Create shareable infographics about moving statistics
- [ ] Publish press releases for company milestones
- [ ] Guest post on moving and lifestyle blogs
- [ ] Sponsor local events and charities
- [ ] Create linkable assets (moving cost calculator, packing checklist)
- [ ] Reach out to bloggers for product reviews

### Target Domains
- Local news websites
- Moving and relocation blogs
- Student accommodation websites
- Property and real estate portals
- Business directories

---

## 8. User Reviews & Trust Signals ⭐

### Objective
Integrate review widgets and display aggregate ratings using structured data.

### Actions
- [ ] Integrate Trustpilot widget on homepage
- [ ] Add Google Reviews widget to service pages
- [ ] Display star ratings with Review schema
- [ ] Create dedicated testimonials page
- [ ] Add customer photos/videos (with permission)
- [ ] Implement review request automation after completed moves
- [ ] Add trust badges (insurance, certifications, awards)
- [ ] Display "Trusted by 50,000+ customers" prominently

### Review Schema Implementation
```typescript
{
  "@type": "Review",
  "author": { "@type": "Person", "name": "Customer Name" },
  "reviewRating": { "@type": "Rating", "ratingValue": "5" },
  "reviewBody": "Excellent service...",
  "datePublished": "2025-01-20"
}
```

---

## 9. Monitoring & Analytics 📊

### Objective
Set up comprehensive monitoring and track keyword performance.

### Tools to Configure
- [x] Google Search Console (verify setup)
- [ ] Google Analytics 4 (verify goals and events)
- [ ] Google Tag Manager (implement tracking)
- [ ] Bing Webmaster Tools
- [ ] SEMrush/Ahrefs for keyword tracking
- [ ] Hotjar/Microsoft Clarity for user behavior
- [ ] Uptime monitoring (Pingdom, UptimeRobot)

### Metrics to Track
- Organic traffic growth
- Keyword rankings (top 20 target keywords)
- Click-through rates (CTR)
- Bounce rates by page
- Conversion rates (quote requests, phone calls)
- Core Web Vitals scores
- Crawl errors and indexing status
- Backlink profile growth

### Reporting Cadence
- **Daily**: Search Console errors, ranking changes
- **Weekly**: Traffic trends, conversion performance
- **Monthly**: Comprehensive SEO health report

---

## Priority Implementation Order

### Phase 1 (Week 1-2): Foundation
1. ✅ Metadata optimization across all pages
2. ✅ Enhanced structured data (FAQ, Review, Breadcrumb schemas)
3. ✅ Internal linking audit and implementation
4. ✅ Mobile responsiveness verification

### Phase 2 (Week 3-4): Content & Performance
1. Content expansion (first 5 blog posts)
2. Image optimization and WebP conversion
3. Core Web Vitals improvements
4. Accessibility audit and fixes

### Phase 3 (Week 5-6): Authority Building
1. Review widget integration
2. Backlink outreach campaign
3. Local directory submissions
4. Social proof implementation

### Phase 4 (Ongoing): Monitoring & Iteration
1. Analytics setup and monitoring
2. Regular content updates
3. Continuous performance optimization
4. Monthly SEO health checks

---

## Success Metrics

### 3-Month Goals
- Organic traffic: +50% increase
- Target keywords in top 10: 15+ keywords
- Core Web Vitals: All pages pass
- Backlinks: +30 high-quality links
- Reviews: 100+ new Trustpilot reviews

### 6-Month Goals
- Organic traffic: +100% increase
- Target keywords in top 3: 20+ keywords
- Domain Authority: +10 points
- Conversion rate: 5%+ from organic traffic
- Featured snippets: 5+ owned

---

## Notes

- All updates must be deployment-ready with 0 errors
- Follow existing project structure
- Use English for all code and documentation
- Test on multiple devices and browsers before deployment
- Monitor Search Console for any negative impacts after changes

---

**Last Updated**: October 21, 2025  
**Next Review**: November 1, 2025

