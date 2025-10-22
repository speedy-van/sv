# Speedy Van Booking-Luxury Integrations

## Overview

This document describes the integrations implemented for the `booking-luxury` system, including dynamic pricing, email notifications, and SMS notifications.

## 🎯 Integrated Services

### 1. Dynamic Pricing Engine

**Location**: `packages/pricing/`

**Features**:
- Distance-based pricing calculation
- Time-sensitive rates
- Service type multipliers (man-and-van, van-only, premium, express)
- Promotional discounts
- Real-time rate calculations
- UK market optimized (GBP currency, miles distance)

**Usage in booking-luxury**:
```typescript
const { calculatePricing, getPricing, isPricingCalculated } = useBooking();

// Calculate pricing when user completes step 1 (WhereAndWhatStep)
await calculatePricing();

// Get calculated pricing
const pricing = getPricing();
if (pricing?.success) {
  console.log('Total price:', pricing.breakdown.totalPrice);
}
```

### 2. Resend Email Integration

**Location**: `src/lib/email/UnifiedEmailService.ts`

**Features**:
- Booking confirmation emails
- Payment confirmation emails
- Booking reminder emails
- Booking cancellation emails
- Driver assignment notifications
- HTML and text email templates
- Professional email branding
- Automatic fallback to SendGrid

**Environment Variables**:
```env
RESEND_API_KEY=re_your_resend_api_key_here
MAIL_FROM=noreply@speedy-van.co.uk
```

**Usage**:
```typescript
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

// Send booking confirmation
await unifiedEmailService.sendOrderConfirmation({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  orderNumber: 'booking_123',
  pickupAddress: '123 Main St, London',
  dropoffAddress: '456 Oak Ave, Manchester',
  scheduledDate: '2024-12-20',
  totalAmount: 150.00,
  currency: 'GBP',
  items: [{ name: 'Sofa', quantity: 1, price: 150.00 }],
});
```

### 3. Voodoo SMS Integration

**Location**: `src/lib/sms/VoodooSMSService.ts`

**Features**:
- UK national number support (automatic normalization to 0044)
- Booking confirmation SMS
- Payment confirmation SMS
- Driver assignment notifications
- Automatic retry mechanism (2 attempts max)
- Phone number validation and normalization
- Comprehensive error handling

**Supported UK Number Formats** (auto-converted to 0044):
- `07901846297` → `00447901846297`
- `00447901846297` → `00447901846297`
- `+447901846297` → `00447901846297`
- `447901846297` → `00447901846297`

**Environment Variables**:
```env
VOODOO_SMS_API_KEY=your_voodoo_api_key
```

**Usage**:
```typescript
import { getVoodooSMSService } from '@/lib/sms/VoodooSMSService';

const voodooSMS = getVoodooSMSService();

// Send booking confirmation SMS
await voodooSMS.sendBookingConfirmation({
  phoneNumber: '07901846297',
  customerName: 'John Doe',
  orderNumber: 'booking_123',
  pickupAddress: '123 Main St, London',
  dropoffAddress: '456 Oak Ave, Manchester',
  scheduledDate: '2024-12-20',
});

// Send payment confirmation
await voodooSMS.sendPaymentConfirmation({
  phoneNumber: '07901846297',
  customerName: 'John Doe',
  orderNumber: 'booking_123',
  amount: 150.00,
});

// Send driver assignment notification
await voodooSMS.sendDriverAssignment({
  phoneNumber: '07901846297',
  customerName: 'John Doe',
  orderNumber: 'booking_123',
  driverName: 'Mike Smith',
  driverPhone: '07912345678',
});
```

## 🔄 Booking Context Integration

**Location**: `src/lib/booking-context.tsx` (simplified booking system)

**New Functions Added**:

### Pricing Functions
- `calculatePricing()`: Calculate pricing based on current form data
- `getPricing()`: Get current pricing data
- `isPricingCalculated`: Boolean indicating if pricing has been calculated
- `pricingError`: Any error from pricing calculation

### Notification Functions
- `sendBookingConfirmation()`: Send email + SMS confirmation
- `sendBookingReminder()`: Send email + SMS reminder
- `sendPaymentConfirmation()`: Send email + SMS payment confirmation
- `sendBookingCancellation(reason?)`: Send email + SMS cancellation

**Usage in Components**:
```typescript
const { 
  calculatePricing, 
  sendBookingConfirmation, 
  sendPaymentConfirmation 
} = useBooking();

// In WhereAndWhatStep - calculate pricing when user completes step
useEffect(() => {
  if (pickupAddress && dropoffAddress && items.length > 0) {
    calculatePricing();
  }
}, [pickupAddress, dropoffAddress, items]);

// Booking confirmation is now automatic after payment
// No manual confirmation step required - webhook handles everything
```

## 📱 Stripe Payment Integration

**Location**: `src/app/booking-luxury/components/StripePaymentButton.tsx`

**Features**:
- Secure Stripe Checkout integration
- Real-time pricing display
- Payment success/failure handling
- Automatic notification sending on successful payment
- Professional UI with loading states
- Security badges and trust indicators

**Usage**:
```typescript
<StripePaymentButton
  amount={form.getValues('pricing')?.totalPrice || 0}
  bookingData={{
    customer: customerDetails,
    pickupAddress: form.getValues('pickupAddress'),
    dropoffAddress: form.getValues('dropoffAddress'),
    items: form.getValues('items'),
    pricing: form.getValues('pricing'),
    bookingId: `booking_${Date.now()}`,
  }}
  onSuccess={(sessionId) => {
    // Payment successful - notifications sent automatically
    console.log('Payment successful:', sessionId);
  }}
  onError={(error) => {
    console.error('Payment failed:', error);
  }}
  disabled={!termsAccepted}
/>
```

## 🚀 Implementation Flow

### 1. User Journey
1. **Step 1 (WhereAndWhatStep)**: User selects pickup/dropoff and items
   - Pricing is automatically calculated
   - Real-time price updates displayed

2. **Step 2 (WhoAndPaymentStep)**: User enters details and selects payment
   - Stripe payment option available
   - Payment method selection

3. **Step 3 (ConfirmationStep)**: User confirms booking
   - Booking confirmation sent (email + SMS)
   - Payment confirmation sent (if paid)

### 2. Notification Triggers
- **Booking Confirmation**: When user completes booking
- **Payment Confirmation**: When Stripe payment succeeds
- **Booking Reminder**: 24 hours before scheduled time (TODO: implement scheduler)
- **Booking Cancellation**: When user cancels booking

## 🛠️ Configuration

### Environment Variables Required

```env
# Pricing (uses existing engine)
# No additional env vars needed

# Resend
RESEND_API_KEY=re_your_resend_api_key_here
MAIL_FROM=noreply@speedy-van.co.uk

# TheSMSWorks
THESMSWORKS_KEY=your_sms_works_key
THESMSWORKS_SECRET=your_sms_works_secret
THESMSWORKS_JWT=your_sms_works_jwt

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Phone Number Format Support

The SMS service automatically normalizes UK phone numbers:

```typescript
// All these formats are supported and normalized to +447901846297
'07901846297'      // Mobile with leading 0
'00447901846297'   // International with 0044
'+447901846297'    // International with +44
'447901846297'     // International without +
```

## 📊 Error Handling

All integrations include comprehensive error handling:

- **Pricing Errors**: Displayed to user with retry option
- **Email Errors**: Logged, fallback to SMS only
- **SMS Errors**: Logged, fallback to email only
- **Payment Errors**: Displayed to user with retry option

## 🔧 Testing

### Test Phone Numbers
- Use UK test numbers: `07901846297`, `00447901846297`
- Test email: `test@speedy-van.co.uk`

### Test Stripe
- Use Stripe test mode with test card numbers
- Test webhook endpoints

## 📈 Monitoring

All integrations include logging and monitoring:

- **Console Logging**: All API calls and responses logged
- **Error Tracking**: Failed requests tracked with details
- **Success Metrics**: Successful notifications tracked
- **Cost Tracking**: SMS costs tracked per message

## 🚀 Future Enhancements

1. **Scheduled Notifications**: Implement cron jobs for reminders
2. **Template Management**: Admin interface for email/SMS templates
3. **Analytics Dashboard**: Track notification delivery rates
4. **A/B Testing**: Test different message templates
5. **Multi-language Support**: Support for different languages
6. **WhatsApp Integration**: Add WhatsApp notifications
7. **Push Notifications**: Mobile app notifications

## 📚 API Documentation

### Resend API
- [Resend API Documentation](https://resend.com/docs)

### TheSMSWorks API
- [TheSMSWorks API Documentation](https://thesmsworks.co.uk/api-documentation/)

### Stripe API
- [Stripe API Documentation](https://stripe.com/docs/api)

## 🆘 Troubleshooting

### Common Issues

1. **Pricing not calculating**: Check if pickup/dropoff addresses and items are selected
2. **Email not sending**: Verify Resend API key and from email
3. **SMS not sending**: Verify TheSMSWorks credentials and phone number format
4. **Stripe payment failing**: Check Stripe keys and webhook configuration

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
LOG_LEVEL=debug
```

This will show detailed logs for all API calls and responses.
