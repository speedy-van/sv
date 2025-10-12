# Stripe Integration Rebuild Documentation

## Overview

The Stripe integration has been completely rebuilt with modern best practices, enhanced error handling, and improved functionality. This document outlines the new architecture and how to use it.

## 🚀 New Features

### Enhanced Configuration Management

- **Singleton Pattern**: Centralized Stripe configuration with lazy initialization
- **Environment Validation**: Comprehensive validation of all required environment variables
- **Key Format Validation**: Automatic validation of Stripe key formats
- **Caching**: Account ID caching to reduce API calls
- **Error Handling**: Detailed error messages and graceful fallbacks

### Improved API Functions

- **Payment Intent Creation**: Enhanced payment intent creation with customer management
- **Checkout Sessions**: Improved checkout session creation with better metadata
- **Refund Processing**: Streamlined refund processing with database updates
- **Customer Management**: Automatic customer creation and management
- **Webhook Handling**: Enhanced webhook processing with better error handling

### New Utility Functions

- **Payment Validation**: Amount and currency validation
- **Formatting**: Currency formatting utilities
- **Payment Method Management**: Save, retrieve, and manage payment methods
- **Setup Intents**: Support for saving payment methods for future use

## 📁 File Structure

```
src/lib/
├── stripe.ts              # Main Stripe configuration and core functions
├── payment-utils.ts       # Enhanced payment utilities
└── payment.ts             # Legacy payment functions (for backward compatibility)

src/app/api/
├── checkout/
│   ├── session/route.ts   # Enhanced checkout session creation
│   └── verify/route.ts    # Improved session verification
└── webhooks/
    └── stripe/route.ts    # Enhanced webhook processing

scripts/
├── test-stripe-config.ts  # Enhanced configuration testing
├── get-stripe-account-id.ts # Improved account ID retrieval
└── setup-stripe.ts        # New comprehensive setup script
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Optional (will be retrieved automatically)
STRIPE_ACCOUNT_ID=acct_your_stripe_account_id_here
```

### Setup Commands

```bash
# Test current configuration
npm run test:stripe-config

# Get account ID
npm run get-stripe-account-id

# Interactive setup
npm run setup:stripe
```

## 💳 Usage Examples

### Basic Stripe Configuration

```typescript
import { stripeConfig } from '@/lib/stripe';

// Initialize Stripe (automatically validates configuration)
const stripe = await stripeConfig.initialize();

// Check if in test mode
const isTestMode = stripeConfig.isTestMode();

// Get account ID (cached)
const accountId = await stripeConfig.getAccountId();
```

### Creating a Payment Intent

```typescript
import { createPaymentIntent } from '@/lib/stripe';

const paymentIntent = await createPaymentIntent({
  amount: 2000, // £20.00 in pence
  currency: 'gbp',
  customerId: 'cus_1234567890',
  description: 'Payment for booking ABC123',
  metadata: {
    bookingId: 'booking_123',
    customerId: 'customer_456',
  },
});
```

### Creating a Checkout Session

```typescript
import { createCheckoutSession } from '@/lib/stripe';

const session = await createCheckoutSession({
  lineItems: [
    {
      price_data: {
        currency: 'gbp',
        product_data: {
          name: 'Speedy Van Booking ABC123',
          description: 'Transportation service',
        },
        unit_amount: 2000,
      },
      quantity: 1,
    },
  ],
  successUrl: 'https://your-domain.com/success',
  cancelUrl: 'https://your-domain.com/cancel',
  metadata: {
    bookingId: 'booking_123',
  },
  expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour
});
```

### Processing a Refund

```typescript
import { processRefund } from '@/lib/stripe';

const refund = await processRefund({
  paymentIntentId: 'pi_1234567890',
  amount: 1000, // £10.00 refund
  reason: 'customer_requested',
  metadata: {
    refundReason: 'Customer requested partial refund',
  },
});
```

### Customer Management

```typescript
import { createOrUpdateCustomer } from '@/lib/stripe';

const customer = await createOrUpdateCustomer({
  email: 'customer@example.com',
  name: 'John Doe',
  phone: '+1234567890',
  metadata: {
    bookingId: 'booking_123',
  },
});
```

### Enhanced Payment Utilities

```typescript
import {
  createPaymentWithCustomer,
  processRefundWithDatabase,
  formatAmount,
  validatePaymentAmount,
} from '@/lib/payment-utils';

// Create payment with automatic customer management
const { paymentIntent, customer } = await createPaymentWithCustomer({
  bookingId: 'booking_123',
  amount: 2000,
  currency: 'gbp',
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  description: 'Transportation service',
});

// Process refund with database updates
const refund = await processRefundWithDatabase({
  paymentIntentId: 'pi_1234567890',
  amount: 1000,
  reason: 'customer_requested',
});

// Format amount for display
const formattedAmount = formatAmount(2000, 'gbp'); // "£20.00"

// Validate payment amount
const isValid = validatePaymentAmount(2000, 'gbp'); // true
```

## 🔗 Webhook Processing

### Enhanced Webhook Handler

The webhook handler now includes:

- **Signature Verification**: Secure webhook signature verification
- **Event Type Handling**: Support for multiple event types
- **Error Handling**: Graceful error handling with detailed logging
- **Database Updates**: Automatic database updates for payment status
- **Notifications**: Email receipts and admin notifications

### Supported Events

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

## 🛡️ Security Features

### Environment Validation

- Automatic validation of all required environment variables
- Key format validation (sk*test*, sk*live*, pk*test*, pk*live*)
- Webhook secret validation

### Error Handling

- Comprehensive error handling with detailed messages
- Graceful fallbacks for missing configuration
- Secure error responses (no sensitive data exposure)

### Webhook Security

- Signature verification for all webhooks
- Event type validation
- Amount and currency integrity checks

## 🧪 Testing

### Configuration Testing

```bash
# Test current configuration
npm run test:stripe-config

# Output includes:
# ✅ Environment variables validation
# ✅ Key format validation
# ✅ API connectivity test
# ✅ Account information
# ✅ Configuration methods test
# ✅ Account ID caching test
```

### Setup Testing

```bash
# Interactive setup and testing
npm run setup:stripe

# Features:
# - Configuration validation
# - Key testing
# - Account ID retrieval
# - Webhook setup guidance
# - Environment file updates
```

## 🔄 Migration from Legacy

### Backward Compatibility

The new implementation maintains backward compatibility with existing code:

```typescript
// Old way (still works)
import { stripe } from '@/lib/stripe';
const paymentIntent = await stripe.paymentIntents.create({...});

// New way (recommended)
import { stripeConfig, createPaymentIntent } from '@/lib/stripe';
const stripe = await stripeConfig.initialize();
const paymentIntent = await createPaymentIntent({...});
```

### Migration Steps

1. **Update imports** (optional, for new features)
2. **Test configuration** using `npm run test:stripe-config`
3. **Update webhook endpoints** if using custom webhook handling
4. **Review error handling** in existing code

## 📊 Monitoring and Logging

### Enhanced Logging

The new implementation includes comprehensive logging:

```typescript
// Automatic logging for:
// - Configuration initialization
// - API calls
// - Error conditions
// - Webhook processing
// - Payment status changes
```

### Error Tracking

- Detailed error messages with context
- Error categorization (configuration, API, validation)
- Graceful error handling with fallbacks

## 🚀 Performance Improvements

### Caching

- Account ID caching to reduce API calls
- Singleton pattern for configuration
- Lazy initialization

### Optimization

- Reduced API calls through better data management
- Efficient error handling
- Optimized webhook processing

## 🔧 Troubleshooting

### Common Issues

1. **Missing Environment Variables**

   ```bash
   npm run test:stripe-config
   # Will show exactly which variables are missing
   ```

2. **Invalid Key Format**

   ```bash
   npm run setup:stripe
   # Will validate and guide you through setup
   ```

3. **Webhook Issues**
   - Check webhook endpoint URL
   - Verify webhook secret
   - Check event types in Stripe dashboard

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=true
LOG_LEVEL=debug
```

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Payment Utilities Documentation](./src/lib/payment-utils.ts)

## 🤝 Support

For issues with the Stripe integration:

1. Run `npm run test:stripe-config` to diagnose configuration issues
2. Check the logs for detailed error messages
3. Verify webhook configuration in Stripe dashboard
4. Review this documentation for usage examples

---

**Note**: This rebuild maintains full backward compatibility while adding significant improvements in security, error handling, and functionality.
