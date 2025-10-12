# Company Address Update Summary

## New Address
```
Speedy Van
Office 2.18
1 Barrack Street
Hamilton
ML3 0DG
United Kingdom
```

## Updated Files

### Environment Variables
- ✅ `env.production` - NEXT_PUBLIC_COMPANY_ADDRESS updated
- ✅ `env.example` - NEXT_PUBLIC_COMPANY_ADDRESS updated
- ✅ `env.download` - NEXT_PUBLIC_COMPANY_ADDRESS updated
- ✅ `render.yaml` - Deployment config updated

### Core Application Files
- ✅ `apps/web/src/lib/constants/company.ts` - Company constants updated (COMPANY_INFO, COMPANY_CONTACT)
- ✅ `apps/web/src/components/site/Header.tsx` - Header address updated
- ✅ `apps/web/src/components/site/Footer.tsx` - Footer address updated
- ✅ `apps/web/src/lib/email/UnifiedEmailService.ts` - Email footer updated

### SEO & Schema Files
- ✅ `apps/web/src/components/Schema/LocalBusinessSchema.tsx` - Schema.org address & coordinates updated
  - Street Address: Office 2.18, 1 Barrack Street
  - Locality: Hamilton
  - Region: South Lanarkshire
  - Postcode: ML3 0DG
  - Coordinates: 55.7790, -4.0393

### Page Components
- ✅ `apps/web/src/app/contact/page.tsx` - Contact page address updated
- ✅ `apps/web/src/app/(public)/about/page.tsx` - About page registered address updated
- ✅ `apps/web/src/app/offline/page.tsx` - Offline page address updated

### API Routes
- ✅ `apps/web/src/app/api/booking-luxury/invoice/[id]/route.ts` - Invoice generation address updated

### Database & Testing
- ✅ `apps/web/src/lib/uk-address-database.ts` - UK address database updated with Hamilton addresses
- ✅ `apps/web/src/app/api/address/debug/route.ts` - Debug route test postcode updated
- ✅ `test-smart-clustering.js` - Test data updated

### Legacy Files
- ✅ `App.jsx` - Legacy app footer updated

### Documentation Files
- ✅ `UNIFIED_PROJECT_WORKFLOW.md` - Environment variables and address references updated
- ✅ `SEO_WORKFLOW.md` - SEO address references updated
- ✅ `PRODUCTION_READINESS_REPORT.md` - Production environment variables updated
- ✅ `RENDER_ENV_VARIABLES.md` - Render deployment variables updated
- ✅ `RENDER_DEPLOYMENT_GUIDE_FINAL.md` - Deployment guide updated
- ✅ `RENDER_STRIPE_PRODUCTION_FIX.md` - Production fix documentation updated
- ✅ `ROYAL_MAIL_PAF_INTEGRATION_COMPLETE.md` - Example addresses updated
- ✅ `ENVIRONMENT_VARIABLES_PAF_UPDATE.md` - Test postcode examples updated
- ✅ `ADDRESS_AUTOCOMPLETE_IMPROVEMENTS_COMPLETE.md` - Test examples updated

## Geographic Information

### Old Address
- Location: Glasgow City, Scotland
- Postcode: G21 2QB
- Coordinates: 55.8642, -4.2518

### New Address
- Location: Hamilton, South Lanarkshire, Scotland
- Postcode: ML3 0DG
- Coordinates: 55.7790, -4.0393

## Next Steps

1. ✅ **Environment Variables**: Update `.env.local` with new address
   ```
   NEXT_PUBLIC_COMPANY_ADDRESS=Office 2.18, 1 Barrack Street, Hamilton, ML3 0DG
   ```

2. 🔄 **External Services to Update**:
   - Google Business Profile
   - Google Maps listing
   - SEO meta tags (automatically updated via Schema.org)
   - Email service provider signatures
   - Invoice templates (automatically updated)

3. 🔄 **Deployment**:
   - Deploy to production to reflect changes
   - Verify SEO snippets in search results
   - Test email previews with new footer

4. 🔄 **Third-Party Integrations**:
   - Update Google My Business
   - Update Bing Places
   - Update any directory listings
   - Update payment gateway merchant info if needed

## Notes

- All hardcoded references have been updated
- SEO schema includes new geographic coordinates
- Email templates will automatically use new address
- PDF invoices will show new address
- Documentation files updated for consistency

## Verification Checklist

- [x] Frontend components show new address
- [x] Email templates include new address
- [x] SEO metadata updated
- [x] Invoice generation uses new address
- [x] Environment variables configured
- [x] Deployment configs updated
- [ ] Google Business updated (manual)
- [ ] External directory listings updated (manual)

---

**Date**: October 8, 2025  
**Updated By**: AI Assistant  
**Status**: Complete ✅

