/**
 * Test Stripe API Key
 * 
 * This script tests the Stripe API key from .env.local
 * to verify it's valid and working.
 */

import Stripe from 'stripe';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Try multiple paths for .env.local
const possiblePaths = [
  resolve(__dirname, '../../.env.local'), // Root of monorepo
  resolve(__dirname, '../../../.env.local'), // One level up
  resolve(process.cwd(), '.env.local'), // Current working directory
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  if (existsSync(envPath)) {
    console.log(`📁 Loading .env.local from: ${envPath}`);
    config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  .env.local not found in standard locations, trying default dotenv behavior...');
  config(); // Try default behavior (looks for .env in current directory)
}

async function testStripeKey() {
  console.log('🔍 Testing Stripe API Key...\n');

  // Debug: Show loaded environment variables (safely)
  const envKeys = Object.keys(process.env).filter(key => 
    key.includes('STRIPE') || key.includes('stripe')
  );
  if (envKeys.length > 0) {
    console.log('📋 Found Stripe-related environment variables:');
    envKeys.forEach(key => {
      const value = process.env[key] || '';
      const displayValue = value.length > 0 
        ? `${value.substring(0, 12)}...` 
        : '(empty)';
      console.log(`   ${key}: ${displayValue}`);
    });
    console.log('');
  } else {
    console.log('⚠️  No Stripe-related environment variables found');
    console.log('');
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
    console.error('');
    console.error('💡 Please add the following to your .env.local file:');
    console.error('   STRIPE_SECRET_KEY=sk_live_your_key_here');
    console.error('   (or sk_test_... for test mode)');
    console.error('');
    console.error('📝 The key should start with:');
    console.error('   - sk_live_... (for production/live keys)');
    console.error('   - sk_test_... (for test/development keys)');
    process.exit(1);
  }

  // Show key prefix (for debugging)
  const keyPrefix = stripeSecretKey.substring(0, 12);
  const isLiveKey = stripeSecretKey.startsWith('sk_live_');
  const isTestKey = stripeSecretKey.startsWith('sk_test_');

  console.log('📋 Key Information:');
  console.log(`   Prefix: ${keyPrefix}...`);
  console.log(`   Type: ${isLiveKey ? 'LIVE' : isTestKey ? 'TEST' : 'UNKNOWN'}`);
  console.log('');

  // Initialize Stripe
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-04-10',
  });

  try {
    // Test 1: Get account information
    console.log('🧪 Test 1: Retrieving account information...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Account retrieved successfully');
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Type: ${account.type}`);
    console.log(`   Charges Enabled: ${account.charges_enabled ? '✅' : '❌'}`);
    console.log(`   Payouts Enabled: ${account.payouts_enabled ? '✅' : '❌'}`);
    console.log(`   Details Submitted: ${account.details_submitted ? '✅' : '❌'}`);
    console.log('');

    // Test 2: Create a test payment intent
    console.log('🧪 Test 2: Creating test payment intent...');
    const testPaymentIntent = await stripe.paymentIntents.create({
      amount: 100, // £1.00 in pence
      currency: 'gbp',
      payment_method_types: ['card'],
      capture_method: 'manual', // Don't capture immediately
      metadata: {
        test: 'true',
        environment: 'key_validation_test',
      },
    });
    console.log('✅ Payment intent created successfully');
    console.log(`   Payment Intent ID: ${testPaymentIntent.id}`);
    console.log(`   Amount: £${(testPaymentIntent.amount / 100).toFixed(2)}`);
    console.log(`   Currency: ${testPaymentIntent.currency.toUpperCase()}`);
    console.log(`   Status: ${testPaymentIntent.status}`);
    console.log('');

    // Test 3: Cancel the test payment intent
    console.log('🧪 Test 3: Cancelling test payment intent...');
    await stripe.paymentIntents.cancel(testPaymentIntent.id);
    console.log('✅ Payment intent cancelled successfully');
    console.log('');

    // Summary
    console.log('🎉 All tests passed!');
    console.log('==========================================');
    console.log('✅ Stripe API key is valid and working');
    console.log(`✅ Account: ${account.id}`);
    console.log(`✅ Key Type: ${isLiveKey ? 'LIVE (Production)' : isTestKey ? 'TEST (Development)' : 'UNKNOWN'}`);
    console.log('==========================================');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Stripe test failed!');
    console.error('==========================================');
    console.error(`Error Type: ${error.type || 'unknown'}`);
    console.error(`Error Code: ${error.code || 'unknown'}`);
    console.error(`Error Message: ${error.message}`);
    
    if (error.statusCode === 401) {
      console.error('\n💡 This usually means:');
      console.error('   - The API key is invalid');
      console.error('   - The API key has been revoked');
      console.error('   - The API key format is incorrect');
    } else if (error.statusCode === 403) {
      console.error('\n💡 This usually means:');
      console.error('   - The API key doesn\'t have permission for this operation');
      console.error('   - The account is restricted');
    } else if (error.statusCode === 404) {
      console.error('\n💡 This usually means:');
      console.error('   - The resource doesn\'t exist');
      console.error('   - The API endpoint is incorrect');
    }

    console.error('\n📝 Please check:');
    console.error('   1. Your .env.local file has the correct STRIPE_SECRET_KEY');
    console.error('   2. The key is not expired or revoked');
    console.error('   3. You have internet connectivity');
    console.error('   4. Stripe API is not experiencing issues');
    
    process.exit(1);
  }
}

// Run the test
testStripeKey().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

