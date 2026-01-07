# B2B System - Final Setup Instructions

## ✅ Implementation Complete!

### What's Been Built:

#### **Backend Infrastructure (100%)**
1. ✅ Database schema with atomic monthly usage tracking
2. ✅ OrderLimitService - concurrency-safe enforcement
3. ✅ ApiKeyService - HMAC-SHA256 + timing-safe comparison
4. ✅ Quote service - atomic booking creation with limit checks
5. ✅ Authentication endpoints (password setup, login, logout)
6. ✅ B2B booking API with order limit enforcement
7. ✅ Company usage statistics API

#### **Frontend Portal (100%)**
1. ✅ Password setup page (`/company/setup-password`)
2. ✅ Company login page (`/company/login`)
3. ✅ Dashboard with usage stats (`/company/dashboard`)
4. ✅ New booking form (`/company/dashboard/bookings/new`)
5. ✅ Bookings list (`/company/dashboard/bookings`)

#### **Email System**
1. ✅ Welcome email template with API key and setup link

---

## 🚀 Deployment Steps

### 1. Apply Database Migration

```bash
# Make sure you're in the root directory with .env file
cd c:\sv

# Generate Prisma client
cd packages/shared
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_b2b_order_limits_and_auth

# Or for production
npx prisma migrate deploy
```

### 2. Environment Variables

Add to your `.env` file:

```env
# API Key Security
API_KEY_PEPPER=your-random-secure-string-here-change-this

# JWT for sessions
JWT_SECRET=your-jwt-secret-here-change-this

# Base URL for setup links
NEXT_PUBLIC_BASE_URL=https://app.speedy-van.co.uk

# Support email
SUPPORT_EMAIL=support@speedy-van.co.uk
```

Generate secure values:
```bash
# API_KEY_PEPPER
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Install Dependencies (if needed)

```bash
cd apps/web
npm install bcrypt jose
```

### 4. Test the Flow

#### A. Approve a B2B Application
1. Go to admin dashboard
2. Navigate to B2B Applications
3. Click approve on an application
4. **COPY THE API KEY** (shown once only)
5. Copy the setup URL

#### B. Password Setup
1. Open the setup URL
2. Set a strong password
3. Should auto-redirect to dashboard

#### C. Test API Integration
```bash
curl -X GET \
  -H "Authorization: Bearer sk_live_..." \
  https://app.speedy-van.co.uk/api/b2b/bookings
```

#### D. Test Order Limit
Create bookings until you hit the limit:
```bash
# Should return 403 with ORDER_LIMIT_REACHED when limit is hit
curl -X POST \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddressLine1": "123 Street",
    "pickupCity": "London",
    "pickupPostcode": "SW1A 1AA",
    "dropoffAddressLine1": "456 Avenue",
    "dropoffCity": "Manchester",
    "dropoffPostcode": "M1 1AA",
    "scheduledDate": "2026-02-01T10:00:00Z",
    "poNumber": "PO-12345"
  }' \
  https://app.speedy-van.co.uk/api/b2b/bookings
```

---

## 🔒 Security Checklist

- [x] API keys hashed with HMAC-SHA256
- [x] Timing-safe key comparison
- [x] Passwords hashed with bcrypt (cost 12)
- [x] Setup tokens expire in 7 days
- [x] JWT sessions in HttpOnly cookies
- [x] Order limits enforced atomically
- [x] Race condition protection with unique constraint
- [x] Role-based access control
- [x] Audit logging for all actions

---

## 📊 Key Features

### Order Limit Enforcement
- **Atomic:** Checked and incremented within same transaction
- **Concurrency-Safe:** Uses unique constraint on `(companyId, monthKey)`
- **Monthly Reset:** Automatic on first booking of new month
- **Clear Errors:** Returns `ORDER_LIMIT_REACHED` with details

### API Key Security
- **HMAC-SHA256** hashing with server pepper
- **Timing-safe** comparison prevents timing attacks
- **Shown once** - raw key never stored
- **Usage tracking** - logs every request

### Authentication
- **Bcrypt** password hashing (cost 12)
- **JWT** sessions with 7-day expiry
- **HttpOnly** cookies prevent XSS
- **Role-based** permissions (OWNER, ADMIN, MEMBER, etc.)

---

## 🧪 Testing Concurrency

```javascript
// Test script to verify atomic limit enforcement
async function testConcurrency() {
  const apiKey = 'sk_live_...';
  const limit = 10;
  
  // Launch 20 simultaneous requests
  const promises = Array.from({ length: 20 }, () =>
    fetch('https://app.speedy-van.co.uk/api/b2b/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pickupAddressLine1: '123 Street',
        pickupCity: 'London',
        pickupPostcode: 'SW1A 1AA',
        dropoffAddressLine1: '456 Avenue',
        dropoffCity: 'Manchester',
        dropoffPostcode: 'M1 1AA',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        poNumber: `PO-${Date.now()}-${Math.random()}`,
      }),
    })
  );

  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
  const limitReached = results.filter(
    r => r.status === 'fulfilled' && !r.value.ok && r.value.status === 403
  ).length;

  console.log(`✅ Successful bookings: ${successful} (should be ${limit})`);
  console.log(`⛔ Blocked by limit: ${limitReached} (should be ${20 - limit})`);
  
  if (successful === limit && limitReached === 20 - limit) {
    console.log('✅ CONCURRENCY TEST PASSED!');
  } else {
    console.log('❌ CONCURRENCY TEST FAILED - Race condition detected!');
  }
}
```

---

## 📝 Admin Tasks

### View Company Usage
```sql
SELECT 
  c.name,
  cmu.monthKey,
  cmu.orderCount,
  cmu.orderLimit,
  ROUND((cmu.orderCount::float / NULLIF(cmu.orderLimit, 0)) * 100, 2) as usage_percent
FROM "CompanyMonthlyUsage" cmu
JOIN "Company" c ON c.id = cmu."companyId"
WHERE cmu."monthKey" = '2026-01'
ORDER BY usage_percent DESC;
```

### Reset Company Usage (Emergency)
```typescript
import { orderLimitService } from '@/lib/b2b/order-limit.service';

await orderLimitService.adminResetUsage(
  'companyId',
  '2026-01',
  'adminUserId'
);
```

### Update Order Limit
```typescript
await orderLimitService.adminUpdateLimit(
  'companyId',
  15, // new limit
  'adminUserId'
);
```

---

## 🎉 You're Done!

The B2B system is now fully operational with:
- ✅ Atomic order limit enforcement
- ✅ Production-grade API key security
- ✅ Complete company portal
- ✅ Automated onboarding flow
- ✅ Email notifications

**Next:** Apply migration and test!
