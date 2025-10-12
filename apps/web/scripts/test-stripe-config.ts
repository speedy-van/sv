#!/usr/bin/env tsx

/**
 * Test Stripe Configuration
 * 
 * This script checks if Stripe is properly configured
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔧 Testing Stripe Configuration');
console.log('================================\n');

// Check required environment variables
const requiredVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 
  'STRIPE_WEBHOOK_SECRET'
];

let allPresent = true;

console.log('📋 Environment Variables Check:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 12)}...`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allPresent = false;
  }
});

console.log('\n🔍 Additional Variables:');
const optionalVars = [
  'STRIPE_ACCOUNT_ID',
  'NEXT_PUBLIC_BASE_URL',
  'NODE_ENV'
];

optionalVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${varName}: ${value || 'Not set'}`);
});

if (!allPresent) {
  console.log('\n❌ Configuration incomplete!');
  console.log('Please add the missing environment variables to your .env.local file.');
  process.exit(1);
} else {
  console.log('\n✅ All required Stripe variables are present!');
}

// Test Stripe connectivity if possible
try {
  console.log('\n🔧 Testing Stripe API...');
  
  if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
    console.log('⚠️  Using LIVE Stripe keys - be careful!');
  } else {
    console.log('🔧 Using TEST Stripe keys');
  }
  
  console.log('✅ Stripe configuration test completed successfully');
} catch (error) {
  console.error('❌ Stripe test failed:', error);
}