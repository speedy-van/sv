#!/usr/bin/env node

/**
 * Stripe Live Setup Script for Speedy Van
 * This script helps you configure Stripe for live payments
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Stripe Live Setup for Speedy Van');
console.log('=====================================\n');

// Check if .env.local already exists
const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('⚠️  .env.local already exists!');
  console.log('   Please backup your current file before proceeding.\n');
}

console.log('📋 To set up Stripe for live payments, you need to:');
console.log('');
console.log('1. Go to https://dashboard.stripe.com/');
console.log('2. Switch to LIVE mode (toggle in top right)');
console.log('3. Go to Developers → API keys');
console.log('4. Copy your LIVE keys (not test keys)');
console.log('');

console.log('🔑 Required Environment Variables:');
console.log('   STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here');
console.log(
  '   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here'
);
console.log('   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here');
console.log('');

console.log('📝 Create a .env.local file in the apps/web directory with:');
console.log('');

const envTemplate = `# Stripe Live Configuration
STRIPE_SECRET_KEY="sk_live_your_live_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Application Configuration
NODE_ENV="production"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"

# Other required variables (copy from env.template)
DATABASE_URL="your_database_url"
MAPBOX_ACCESS_TOKEN="your_mapbox_token"
NEXT_PUBLIC_MAPBOX_TOKEN="your_public_mapbox_token"
`;

console.log(envTemplate);

console.log('⚠️  IMPORTANT:');
console.log('   - Never commit .env.local to version control');
console.log('   - Keep your live Stripe keys secure');
console.log('   - Test thoroughly in development first');
console.log('   - Ensure your domain is verified in Stripe');
console.log('');

console.log('🔍 After setup, restart your development server');
console.log('   npm run dev  # or pnpm dev');
console.log('');

console.log('✅ Stripe should then work for live payments!');
