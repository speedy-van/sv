#!/usr/bin/env tsx

/**
 * Verify Stripe Production Configuration
 *
 * This script checks that all Stripe production keys are properly configured
 * and validates their format and connectivity.
 */

import Stripe from 'stripe';

interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  baseUrl: string;
}

function getStripeConfig(): StripeConfig {
  const config: StripeConfig = {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
  };

  return config;
}

function validateKeyFormat(
  key: string,
  expectedPrefix: string,
  keyName: string
): boolean {
  if (!key) {
    console.error(`❌ ${keyName} is missing`);
    return false;
  }

  if (!key.startsWith(expectedPrefix)) {
    console.error(`❌ ${keyName} has invalid format`);
    console.error(
      `   Expected: ${expectedPrefix}..., got: ${key.substring(0, 7)}...`
    );
    return false;
  }

  console.log(`✅ ${keyName} format is valid`);
  return true;
}

async function testStripeConnectivity(secretKey: string): Promise<boolean> {
  try {
    console.log('🔧 Testing Stripe connectivity...');

    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10',
    });

    // Test API connectivity with a simple call
    const account = await stripe.accounts.retrieve();

    console.log('✅ Stripe connectivity test passed');
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Account Type: ${account.type}`);

    return true;
  } catch (error) {
    console.error('❌ Stripe connectivity test failed');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    return false;
  }
}

function checkEnvironment(): void {
  console.log('🔧 Environment Check:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Base URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'not set'}`);
  console.log('');
}

async function main() {
  console.log('🚀 Stripe Production Configuration Verification');
  console.log('=============================================\n');

  checkEnvironment();

  const config = getStripeConfig();

  console.log('🔑 Key Validation:');
  console.log('==================');

  // Validate secret key
  const secretKeyValid = validateKeyFormat(
    config.secretKey,
    'sk_live_',
    'STRIPE_SECRET_KEY'
  );

  // Validate publishable key
  const publishableKeyValid = validateKeyFormat(
    config.publishableKey,
    'pk_live_',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  );

  // Validate webhook secret
  const webhookSecretValid = validateKeyFormat(
    config.webhookSecret,
    'whsec_',
    'STRIPE_WEBHOOK_SECRET'
  );

  // Validate base URL
  const baseUrlValid = config.baseUrl.startsWith('https://');
  if (!baseUrlValid) {
    console.error('❌ NEXT_PUBLIC_BASE_URL must use HTTPS in production');
  } else {
    console.log('✅ NEXT_PUBLIC_BASE_URL uses HTTPS');
  }

  console.log('');

  if (
    !secretKeyValid ||
    !publishableKeyValid ||
    !webhookSecretValid ||
    !baseUrlValid
  ) {
    console.error('❌ Configuration validation failed');
    console.error('   Please fix the issues above before proceeding');
    process.exit(1);
  }

  console.log('✅ All key formats are valid');
  console.log('');

  // Test Stripe connectivity
  const connectivityTest = await testStripeConnectivity(config.secretKey);

  if (!connectivityTest) {
    console.error('❌ Stripe connectivity test failed');
    console.error(
      '   Please check your network connection and API key validity'
    );
    process.exit(1);
  }

  console.log('');
  console.log('🎉 Stripe Production Configuration is Ready!');
  console.log('============================================');
  console.log('');
  console.log('✅ All keys are properly formatted');
  console.log('✅ Stripe API connectivity confirmed');
  console.log('✅ Webhook secret configured');
  console.log('✅ HTTPS base URL configured');
  console.log('');
  console.log('🚀 Your app is ready to process real payments!');
}

main().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
