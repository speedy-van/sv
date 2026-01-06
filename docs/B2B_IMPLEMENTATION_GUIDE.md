# Speedy Van B2B Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the B2B features in the Speedy Van platform.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Migration](#database-migration)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Admin Dashboard Setup](#admin-dashboard-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- Node.js 18+ 
- PostgreSQL 14+
- Redis (for production rate limiting)
- pnpm package manager

### Environment Variables

Add the following to your `.env` file:

```env
# B2B Configuration
B2B_API_ENABLED=true
B2B_DEFAULT_CREDIT_LIMIT=100000  # £1,000.00 in pence
B2B_DEFAULT_PAYMENT_TERMS=30     # Days
B2B_RATE_LIMIT_PER_MIN=60

# API Key Encryption
B2B_API_KEY_SECRET=your-secure-secret-key-here

# Webhook Configuration
B2B_WEBHOOK_SECRET=your-webhook-secret-here
B2B_WEBHOOK_TIMEOUT_MS=30000

# Email Configuration (for B2B notifications)
B2B_NOTIFICATION_EMAIL=b2b@speedyvan.com
```

---

## Database Migration

### Step 1: Update Prisma Schema

The B2B models have been added to `packages/shared/prisma/schema.prisma`. Review the following new models:

- `Company` - B2B company accounts
- `CompanyUser` - Company team members
- `ApiKey` - API authentication keys
- `ApiKeyUsageLog` - API usage tracking
- `PricingRule` - Company-specific pricing
- `CompanyQuote` - B2B quotes
- `CompanyBooking` - B2B booking links
- `CompanyInvoice` - B2B invoices
- `CompanyInvoiceItem` - Invoice line items
- `CompanyInvitation` - User invitations
- `B2BAuditLog` - Audit trail

### Step 2: Generate Migration

```bash
cd packages/shared
npx prisma migrate dev --name add_b2b_models
```

### Step 3: Verify Migration

```bash
npx prisma migrate status
```

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

---

## Configuration

### Admin Navigation

Add B2B section to admin navigation in `apps/web/src/components/admin/AdminNavigation.tsx`:

```typescript
{
  title: 'B2B',
  icon: Building2,
  items: [
    { title: 'Companies', href: '/admin/b2b/companies' },
    { title: 'Invoices', href: '/admin/b2b/invoices' },
    { title: 'Quotes', href: '/admin/b2b/quotes' },
    { title: 'API Analytics', href: '/admin/b2b/analytics' },
  ],
}
```

### Role-Based Access

Add B2B admin permissions in `apps/web/src/lib/auth.ts`:

```typescript
export const B2B_PERMISSIONS = {
  VIEW_COMPANIES: 'b2b.companies.view',
  MANAGE_COMPANIES: 'b2b.companies.manage',
  VIEW_INVOICES: 'b2b.invoices.view',
  MANAGE_INVOICES: 'b2b.invoices.manage',
  VIEW_API_KEYS: 'b2b.apikeys.view',
  MANAGE_API_KEYS: 'b2b.apikeys.manage',
};
```

---

## Testing

### Unit Tests

Create test files in `apps/web/src/lib/b2b/__tests__/`:

```typescript
// company.service.test.ts
import { companyService } from '../company.service';

describe('CompanyService', () => {
  describe('create', () => {
    it('should create a new company', async () => {
      const company = await companyService.create({
        name: 'Test Company',
        creditLimitGBP: 100000,
      });
      
      expect(company.name).toBe('Test Company');
      expect(company.status).toBe('PENDING');
    });
  });
});
```

### API Integration Tests

```typescript
// Test API key authentication
describe('B2B API Authentication', () => {
  it('should authenticate with valid API key', async () => {
    const response = await fetch('/api/b2b/quotes', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
      },
    });
    
    expect(response.status).toBe(200);
  });
  
  it('should reject invalid API key', async () => {
    const response = await fetch('/api/b2b/quotes', {
      headers: {
        'Authorization': 'Bearer invalid_key',
      },
    });
    
    expect(response.status).toBe(401);
  });
});
```

### Manual Testing Checklist

- [ ] Create a new company via admin dashboard
- [ ] Activate the company
- [ ] Add users to the company
- [ ] Generate API keys
- [ ] Test API authentication
- [ ] Create a quote via API
- [ ] Accept quote and create booking
- [ ] Verify invoice generation
- [ ] Test webhook delivery
- [ ] Check audit logs

---

## Deployment

### Pre-Deployment Checklist

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Environment Variables**
   - Verify all B2B environment variables are set
   - Ensure API key secret is secure and unique

3. **Redis Setup** (for production)
   ```bash
   # Rate limiting store
   REDIS_URL=redis://localhost:6379
   ```

4. **Webhook Endpoints**
   - Ensure webhook URLs are accessible
   - Configure SSL certificates

### Deployment Steps

```bash
# 1. Build the application
pnpm build

# 2. Run database migrations
npx prisma migrate deploy

# 3. Start the application
pnpm start
```

### Post-Deployment Verification

1. Access admin dashboard at `/admin/b2b/companies`
2. Create a test company
3. Generate a test API key
4. Make a test API call
5. Verify audit logs

---

## Admin Dashboard Setup

### Creating Your First B2B Company

1. Navigate to **Admin > B2B > Companies**
2. Click **Add Company**
3. Fill in company details:
   - Company Name (required)
   - Legal Name
   - VAT Number
   - Company Registration Number
4. Set credit terms:
   - Credit Limit (e.g., £10,000)
   - Payment Terms (e.g., 30 days)
5. Click **Create Company**
6. Activate the company from the company list

### Managing API Keys

1. Navigate to company detail page
2. Click **API Keys** tab
3. Click **Create API Key**
4. Select required scopes
5. Copy the generated key (shown only once)
6. Share securely with the client

### Setting Up Pricing Rules

1. Navigate to company detail page
2. Click **Pricing** tab
3. Click **Add Rule**
4. Configure rule:
   - Rule Type (Distance, Volume, Discount, etc.)
   - Parameters (rates, percentages)
   - Priority (higher = applied first)
5. Save and activate

---

## Troubleshooting

### Common Issues

#### API Key Not Working

1. Check key format: must start with `sv_b2b_`
2. Verify key is active (not revoked/expired)
3. Check IP whitelist if configured
4. Verify required scopes are granted

#### Rate Limiting Issues

1. Check `X-RateLimit-*` headers
2. Implement exponential backoff
3. Consider upgrading rate limit tier

#### Invoice Generation Failures

1. Check company credit limit
2. Verify billing address is set
3. Check for pending payments

#### Webhook Delivery Failures

1. Verify endpoint is accessible
2. Check SSL certificate validity
3. Review webhook logs in admin
4. Verify signature validation

### Debug Mode

Enable debug logging:

```env
B2B_DEBUG=true
LOG_LEVEL=debug
```

### Support Contacts

- **Technical Issues:** dev-support@speedyvan.com
- **Business Inquiries:** b2b@speedyvan.com
- **Emergency:** +44 20 1234 5678

---

## File Structure

```
apps/web/src/
├── app/
│   ├── admin/
│   │   └── b2b/
│   │       ├── companies/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── invoices/
│   │       │   └── page.tsx
│   │       └── quotes/
│   │           └── page.tsx
│   └── api/
│       ├── admin/
│       │   └── companies/
│       │       ├── route.ts
│       │       └── [id]/
│       │           ├── route.ts
│       │           ├── users/
│       │           │   └── route.ts
│       │           └── apikeys/
│       │               └── route.ts
│       └── b2b/
│           ├── quotes/
│           │   ├── route.ts
│           │   └── [id]/
│           │       └── route.ts
│           ├── bookings/
│           │   └── route.ts
│           └── invoices/
│               └── route.ts
├── components/
│   └── admin/
│       └── b2b/
│           ├── CompaniesListDashboard.tsx
│           ├── CompanyDetailDashboard.tsx
│           ├── CreateCompanyDialog.tsx
│           └── tabs/
│               ├── CompanyUsersTab.tsx
│               ├── CompanyApiKeysTab.tsx
│               ├── CompanyPricingTab.tsx
│               ├── CompanyInvoicesTab.tsx
│               └── CompanyAuditTab.tsx
└── lib/
    └── b2b/
        ├── index.ts
        ├── company.service.ts
        ├── apikey.service.ts
        ├── audit.service.ts
        ├── quote.service.ts
        ├── pricing.service.ts
        ├── invoice.service.ts
        ├── middleware.ts
        ├── schemas.ts
        ├── audit-logger.ts
        └── security.ts

packages/shared/prisma/
└── schema.prisma  # B2B models added

docs/
├── B2B_API_DOCUMENTATION.md
├── B2B_IMPLEMENTATION_GUIDE.md
└── B2B_Transformation_Plan.md

scripts/
└── b2b-migration.ts
```

---

## Next Steps

1. **Phase 2:** Implement B2B customer portal
2. **Phase 3:** Add bulk booking import
3. **Phase 4:** Integrate with accounting systems
4. **Phase 5:** Add advanced analytics dashboard
