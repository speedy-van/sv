# 🚀 **Speedy Van Premium Booking - Quick Reference**

## **⚡ Fast Start Commands**

```bash
# Database operations
npm run db:seed          # Seed with sample data (idempotent)
npm run db:seed --clean  # Clean and recreate all data
npx prisma studio        # View database in browser
npx prisma generate      # Update Prisma client

# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run Playwright tests
npm run test:ui          # Run tests with UI
```

---

## **🔑 Key Environment Variables**

```bash
# Required for basic functionality
DATABASE_URL="postgresql://..."           # Neon PostgreSQL
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"          # Stripe test key
STRIPE_WEBHOOK_SECRET="whsec_..."        # Webhook signature

# Optional for enhanced features
MAPBOX_ACCESS_TOKEN="pk..."              # Real geocoding
SENDGRID_API_KEY="SG..."                 # Email sending
```

---

## **📊 Database Models Quick Reference**

### **Core Models**

- **`Booking`** - Main booking entity with pricing and status
- **`BookingAddress`** - Pickup/dropoff addresses with coordinates
- **`PropertyDetails`** - Property type, access, and floor information
- **`BookingItem`** - Individual items with volume and quantity

### **Key Fields**

```typescript
// Booking status flow
DRAFT → PENDING_PAYMENT → CONFIRMED → COMPLETED
                    ↓
                CANCELLED (on payment failure)

// Pricing breakdown (all in GBP pence)
baseDistanceMiles + distanceCostGBP + accessSurchargeGBP +
weatherSurchargeGBP + itemsSurchargeGBP + crewMultiplierPercent
```

---

## **🌐 API Endpoints Quick Reference**

### **Booking Management**

```bash
GET    /api/booking-luxury/[id]           # Get booking details (migrated)
POST   /api/payment/webhook         # Stripe webhook handler
```

### **Mock Services (Development)**

```bash
POST   /api/routing/calculate       # Calculate route distance/time
GET    /api/weather/forecast        # Get weather forecast
GET    /api/availability/check      # Check crew/van availability
POST   /api/payment/create-checkout-session  # Create Stripe session
POST   /api/invoice/generate        # Generate PDF invoice
POST   /api/email/send-confirmation # Send confirmation email
```

---

## **💳 Stripe Integration Quick Reference**

### **Webhook Events Handled**

- `payment_intent.succeeded` → Status: `CONFIRMED`
- `payment_intent.payment_failed` → Status: `CANCELLED`

### **Local Testing**

```bash
# Terminal 1: Start Stripe CLI
stripe listen --forward-to localhost:3000/api/payment/webhook

# Terminal 2: Start your app
npm run dev

# Check webhook secret matches the one shown by Stripe CLI
```

---

## **🔧 Common Development Tasks**

### **Add New Booking Field**

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_field_name`
3. Update TypeScript types: `npx prisma generate`
4. Update API endpoints and frontend components

### **Seed Database with New Data**

1. Add to `scripts/seed.ts`
2. Use `upsert` for idempotent operations
3. Run `npm run db:seed`

### **Test Payment Flow**

1. Create booking via frontend or API
2. Get booking ID from response
3. Create Stripe checkout session
4. Complete payment in Stripe test mode
5. Verify webhook updates booking status

---

## **🐛 Common Issues & Solutions**

### **Database Connection Issues**

```bash
# Check DATABASE_URL format
# Ensure sslmode=require
# Try primary vs pooler connection
```

### **Stripe Webhook Issues**

```bash
# Verify webhook secret matches Stripe CLI
# Check server logs for signature verification errors
# Ensure no proxy is altering request body
```

### **Prisma Issues**

```bash
# Reset database: npx prisma migrate reset
# Regenerate client: npx prisma generate
# Check schema: npx prisma validate
```

---

## **📱 Frontend Integration**

### **Booking Status Polling**

```typescript
// Poll for status updates after payment
const checkBookingStatus = async (bookingId: string) => {
  const response = await fetch(`/api/booking-luxury/${bookingId}`);
  const booking = await response.json();

  if (booking.status === 'CONFIRMED') {
    // Show success, invoice, etc.
  } else if (booking.status === 'CANCELLED') {
    // Show error message
  }
};
```

### **Reference Generation**

```typescript
import { createUniqueReference } from '@/lib/ref';

// Generate unique booking reference
const reference = await createUniqueReference();
```

---

## **🚀 Production Checklist**

- [ ] **Environment Variables** - All production keys set
- [ ] **Database** - Production PostgreSQL connection
- [ ] **Stripe** - Live keys and webhook secrets
- [ ] **SSL** - HTTPS everywhere
- [ ] **Monitoring** - Error tracking and performance monitoring
- [ ] **Testing** - All smoke tests pass
- [ ] **Backup** - Database backup strategy

---

## **📞 Support Resources**

- **Documentation**: `README.md`, `PRODUCTION_CHECKLIST.md`
- **Testing**: `smoke-tests.md` for end-to-end verification
- **Database**: `npx prisma studio` for data inspection
- **Logs**: Check server console for detailed error messages

---

**💡 Pro Tip**: Use `npm run db:seed` frequently during development to ensure you always have fresh, consistent test data!
