# Environment Setup Guide

This document explains how to set up the environment variables required for the Speedy Van application.

## Required Environment Variables

### Database Configuration

```bash
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### NextAuth Configuration

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here_change_this_in_production
```

### App Configuration

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Maps & Geocoding (Mapbox)

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token_here
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

### Stripe Configuration (Required for payments)

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_ACCOUNT_ID=acct_your_stripe_account_id_here
```

## How to Get Stripe Keys

1. **Create a Stripe Account**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get Test Keys**: In your Stripe dashboard, go to Developers > API keys
3. **Copy the Keys**:
   - `STRIPE_SECRET_KEY`: Starts with `sk_test_` (for testing) or `sk_live_` (for production)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Starts with `pk_test_` (for testing) or `pk_live_` (for production)
   - `STRIPE_WEBHOOK_SECRET`: Get this from your webhook endpoint configuration in Stripe dashboard
   - `STRIPE_ACCOUNT_ID`: Your Stripe account ID (starts with `acct_`). You can find this in your Stripe dashboard under Account Settings > Account details

## Setting Up Environment Variables

1. Copy `.env.local` to `.env.local` (if it doesn't exist)
2. Replace the placeholder values with your actual API keys
3. Restart your development server after making changes

## Current Issue - RESOLVED ✅

The application was failing with a 500 error on the `/api/checkout/session` endpoint because the `STRIPE_SECRET_KEY` environment variable was missing. This has been **FIXED** by adding the required Stripe environment variables.

## Testing the Fix

After adding the Stripe environment variables:

1. Restart your development server
2. Try to make a booking and proceed to checkout
3. The checkout session should now work without the 500 error

## Testing Your Configuration

You can test your Stripe configuration using:

```bash
npm run test:stripe-config
```

This will verify:

- ✅ Environment variables are set correctly
- ✅ Stripe client can be initialized
- ✅ API connectivity is working
- ✅ Account information can be retrieved

You can also get your Stripe account ID automatically:

```bash
npm run get-stripe-account-id
```

This will retrieve your account ID from Stripe and show you exactly what to add to your `.env.local` file.

## Security Notes

- Never commit your `.env.local` file to version control
- Use test keys for development and production keys only in production
- Keep your secret keys secure and rotate them regularly
- The webhook secret is required for secure webhook processing
