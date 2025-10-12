# Stripe Payment ID Fix

## Problem Description

The application was using hardcoded Stripe account IDs (`acct_1ABC123DEF456GHI`) instead of retrieving the actual account ID dynamically from the Stripe API. This caused all payment receipt URLs to use the same account ID, making them appear as if they were from a fixed/constant payment number.

## Root Cause

The issue was in two main files:

1. **`apps/web/src/lib/stripe.ts`** - Used a hardcoded fallback account ID
2. **`apps/web/src/app/(customer-portal)/customer-portal/invoices/page.tsx`** - Used a hardcoded account ID in the receipt URL generation

## Solution Implemented

### 1. Dynamic Account ID Retrieval

Updated `apps/web/src/lib/stripe.ts` to:

- Retrieve the actual Stripe account ID from the Stripe API
- Cache the account ID to avoid repeated API calls
- Fall back to environment variable if API call fails
- Keep the hardcoded fallback as a last resort

### 2. Updated Receipt URL Generation

Modified the receipt URL generation to:

- Use the dynamic account ID retrieval
- Make the function async to handle API calls
- Update all callers to handle the async nature

### 3. Environment Variable Support

Added `STRIPE_ACCOUNT_ID` environment variable:

- Added to `env.example`
- Updated documentation in `ENVIRONMENT_SETUP.md`
- Added validation in test scripts

### 4. Helper Script

Created `apps/web/scripts/get-stripe-account-id.ts` to:

- Automatically retrieve the account ID from Stripe
- Display account information
- Show exactly what to add to `.env.local`

## Files Modified

1. `apps/web/src/lib/stripe.ts` - Dynamic account ID retrieval
2. `apps/web/src/app/(customer-portal)/customer-portal/invoices/page.tsx` - Updated receipt URL generation
3. `apps/web/ENVIRONMENT_SETUP.md` - Added account ID documentation
4. `env.example` - Added STRIPE_ACCOUNT_ID variable
5. `apps/web/scripts/test-stripe-config.ts` - Added account ID validation
6. `apps/web/scripts/get-stripe-account-id.ts` - New helper script
7. `apps/web/package.json` - Added new script command

## How to Apply the Fix

1. **Get your Stripe account ID:**

   ```bash
   npm run get-stripe-account-id
   ```

2. **Add the account ID to your `.env.local`:**

   ```bash
   STRIPE_ACCOUNT_ID=acct_your_actual_account_id_here
   ```

3. **Test the configuration:**

   ```bash
   npm run test:stripe-config
   ```

4. **Restart your development server**

## Benefits

- ✅ Each payment now gets a unique receipt URL with the correct account ID
- ✅ No more fixed/constant payment numbers
- ✅ Proper Stripe integration with real account information
- ✅ Fallback mechanisms ensure the app doesn't break
- ✅ Easy setup with helper scripts

## Backward Compatibility

The fix maintains backward compatibility by:

- Keeping the hardcoded fallback as a last resort
- Supporting the environment variable override
- Graceful error handling if API calls fail

## Testing

After applying the fix:

1. Make a test payment
2. Check that the receipt URL uses your actual Stripe account ID
3. Verify that different payments have different receipt URLs
4. Confirm that the receipt URLs work correctly in Stripe
