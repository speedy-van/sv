# Trustpilot Integration - Developer Guide

## Overview

This document explains the Trustpilot widget integration, what the code ensures, and what must be configured externally.

## HTTP 403 Errors - Root Cause

**The Trustpilot widget returns HTTP 403 errors when the domain is not whitelisted in the Trustpilot dashboard.** This is a **server-side restriction** that cannot be fixed in code.

### Why This Happens

- Trustpilot requires domains to be explicitly whitelisted for security
- The script loads successfully (`https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js` ✅)
- The iframe URL returns 403 (`https://widget.trustpilot.com/trustboxes/.../index.html` ❌)
- This affects both production domains and localhost during development

## What Our Code Ensures ✅

### 1. Centralized Configuration (`src/lib/trustpilot-config.ts`)

- **Business Unit ID validation**: Reads from `NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID` environment variable
- **ID format verification**: Ensures 24-character hexadecimal format
- **Development diagnostics**: Logs full configuration in development mode with:
  - Current origin/domain
  - Business Unit ID and Template ID
  - Expected whitelisted domains
  - Widget URL for manual testing
  - Warning if current domain not in expected list

### 2. Robust Error Handling

- **Graceful degradation**: Widget failures do not crash the app
- **Silent 403 handling**: Prevents console clutter from expected domain restriction errors
- **Development warnings**: Provides clear error messages in development mode
- **Error event suppression**: Prevents unhandled Trustpilot iframe errors from bubbling up

### 3. Script Loading Management

- **Duplicate prevention**: Checks if script already loaded before adding
- **Proper cleanup**: Removes script on component unmount
- **Widget initialization**: Auto-initializes widgets after script loads
- **Async loading**: Uses async/defer attributes for optimal page performance

### 4. Widget Integration Files

- `src/components/site/TrustpilotWidget.tsx` - Main widget component for home pages
- `src/app/booking-luxury/success/page.tsx` - Booking confirmation page widget
- Both use centralized configuration and helper functions

## What YOU Must Check in Trustpilot Dashboard ⚠️

**The code cannot fix server-side 403 errors.** You must verify:

### 1. Domain Whitelisting

Log into your Trustpilot Business account and check:

- **Production Domains**:
  - `https://speedy-van.co.uk`
  - `https://www.speedy-van.co.uk`
  
- **Development Domains** (for localhost testing):
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`

**How to check**: Trustpilot Dashboard → Settings → Widgets → Domain Management

### 2. Business Unit ID Matches

Verify the Business Unit ID in your `.env` file matches your Trustpilot account:

```bash
NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID=68b0fc8a6ad677c356e83f14
```

**How to find**: Trustpilot Dashboard → Settings → Business Details → Business Unit ID

### 3. Template IDs Are Valid

Our widgets use this template:
- Mini Review Count: `56278e9abfbbba0bdcd568bc`

**How to verify**: Trustpilot Dashboard → Widgets → Widget Templates

### 4. Account Status

- Account must be active (not expired/suspended)
- Must have active Trustpilot plan that includes widgets
- Review permissions enabled

## Testing the Integration

### Development Mode Diagnostics

When running in development, the code automatically logs diagnostic information to the console:

```
🔍 Trustpilot widget config: origin=http://localhost:3000, businessUnitId=68b0fc8a6ad677c356e83f14, templateId=56278e9abfbbba0bdcd568bc, token=6c5f8843-4381-4cb0-aecb-26359eb40d5e, locale=en-US
```

### Manual Widget URL Testing

1. Open browser DevTools → Console
2. Find the "Widget URL" in diagnostics
3. Copy and paste URL into browser
4. **If you see 403**: Domain not whitelisted → Check Trustpilot dashboard
5. **If widget loads**: Code is correct → Issue elsewhere

### Production Testing Checklist

- [ ] Verify production domains whitelisted in Trustpilot
- [ ] Check Business Unit ID in production `.env` matches dashboard
- [ ] Test widget on production domain (not localhost)
- [ ] Check browser console for any errors (should be silent 403 handling)
- [ ] Verify widget shows reviews or graceful fallback link

## Environment Variables

Required in `.env` and `.env.local`:

```bash
# Trustpilot Configuration
NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID=68b0fc8a6ad677c356e83f14
NEXT_PUBLIC_TRUSTPILOT_TEMPLATE_ID=56278e9abfbbba0bdcd568bc
NEXT_PUBLIC_TRUSTPILOT_TOKEN=6c5f8843-4381-4cb0-aecb-26359eb40d5e
NEXT_PUBLIC_TRUSTPILOT_LOCALE=en-US
```

## Code Architecture

### Key Functions (`src/lib/trustpilot-config.ts`)

```typescript
getTrustpilotConfig(): TrustpilotConfig
// Returns validated configuration from environment

getTrustpilotWidgetUrl(businessUnitId, templateId): string
// Generates full widget iframe URL for diagnostics

getTrustpilotDiagnostics(businessUnitId, templateId): TrustpilotDiagnostics
// Returns diagnostic info for debugging (dev only)

logTrustpilotDiagnostics(businessUnitId?, templateId?): void
// Logs formatted diagnostics to console (dev only)

isTrustpilotScriptLoaded(): boolean
// Checks if Trustpilot script already loaded

loadTrustpilotWidget(businessUnitId, onError?): cleanup function
// Loads script and initializes widgets, returns cleanup function

initTrustpilotWidget(element, force?): void
// Initializes widget from DOM element
```

### Widget Component Usage

```typescript
import TrustpilotWidget from '@/components/site/TrustpilotWidget';

<TrustpilotWidget
  businessUnitId="68b0fc8a6ad677c356e83f14"  // Optional, uses env var
  templateId="56278e9abfbbba0bdcd568bc"      // Optional, uses env var
  token="6c5f8843-4381-4cb0-aecb-26359eb40d5e" // Optional, uses env var
  locale="en-US"                              // Optional, uses env var
  theme="dark"                                // Optional, "light" or "dark"
  showTitle={true}                            // Optional, show "Trusted by customers"
/>
```

## Troubleshooting

### Widget Shows "View on Trustpilot" Link Only

- **Expected behavior**: Widget still functions with clickable overlay link
- **Not an error**: Graceful fallback when iframe can't load
- **Action**: Verify domain whitelisting if reviews should display

### Console Shows 403 Errors

- **In Production**: Check domain whitelisting in Trustpilot dashboard
- **In Development**: 403s are expected on localhost unless whitelisted
- **Action**: Add localhost domains to Trustpilot whitelist for development

### No Diagnostics Showing

- **Check**: Are you in development mode (`NODE_ENV=development`)?
- **Expected**: Diagnostics only log in development, not production
- **Action**: Run `pnpm dev` or `npm run dev` to enable diagnostics

### Widget Not Appearing At All

1. Check browser console for JavaScript errors
2. Verify `NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID` is set
3. Check Business Unit ID is 24-character hex string
4. Verify Trustpilot script loaded (check Network tab)
5. Inspect DOM for `.trustpilot-widget` elements

## Summary

### ✅ What Code Fixes
- Configuration management and validation
- Error handling and graceful degradation  
- Development diagnostics and debugging tools
- Script loading and widget initialization
- Prevents app crashes from Trustpilot errors

### ⚠️ What Code CANNOT Fix
- **Domain whitelisting**: Must be done in Trustpilot dashboard
- **Server-side 403 errors**: Trustpilot security restriction
- **Account status issues**: Must have active Trustpilot plan
- **Invalid Business Unit IDs**: Must match your Trustpilot account

### 📞 Next Steps If 403 Persists

1. Log into [Trustpilot Business Account](https://businessapp.b2b.trustpilot.com/)
2. Navigate to Settings → Widgets → Domain Management
3. Add your production and development domains
4. Save and wait 5-10 minutes for changes to propagate
5. Clear browser cache and test again

---

**Last Updated**: 2025
**Maintainer**: Development Team
